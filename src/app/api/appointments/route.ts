import { NextResponse } from "next/server";

import {
  createAppointmentResumeToken,
  getAppointmentResumeCookieOptions,
} from "@/lib/security/appointment-session";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import { publicAppointmentSchema } from "@/modules/appointments/schemas";
import { createPublicAppointment, listAvailableSlots } from "@/modules/appointments/service";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { ensurePatientAccountForUser } from "@/modules/patients/account";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const service = searchParams.get("service");

  if (!date) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const slots = await listAvailableSlots(date, service ?? undefined);
    return NextResponse.json(slots);
  } catch (error) {
    log("error", "Failed to load appointment slots", {
      date,
      service,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Nu am putut verifica disponibilitatea. Incearca din nou.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "public-or-account");

    const formData = await request.formData();
    const parsed = publicAppointmentSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      service: formData.get("service"),
      date: formData.get("date"),
      time: formData.get("time"),
      prima_vizita: formData.get("prima_vizita"),
      turnstileToken: formData.get("turnstileToken"),
      website: formData.get("website"),
    });

    if (parsed.website) {
      throw new Error("Cerere invalida.");
    }

    const turnstileValid = await verifyTurnstileToken(parsed.turnstileToken);
    if (!turnstileValid) {
      throw new Error("Verificarea anti-spam a esuat.");
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patientAccount =
      user?.email && user.email_confirmed_at
        ? await ensurePatientAccountForUser(user)
        : null;
    const bookingEmail =
      user?.email && user.email_confirmed_at ? user.email : parsed.email;

    await applyRateLimit({
      key: "appointments:create",
      identifier: `${request.headers.get("x-forwarded-for") ?? "local"}:${bookingEmail}`,
      max: 5,
      windowMs: 10 * 60 * 1000,
    });

    const result = await createPublicAppointment({
      name: parsed.name,
      email: bookingEmail,
      phone: parsed.phone,
      serviceSlug: parsed.service,
      date: parsed.date,
      time: parsed.time,
      isFirstVisit: parsed.prima_vizita === "Da",
      source: patientAccount ? "patient_account" : "public_site",
      patientId: patientAccount?.id ?? null,
      authUserId: patientAccount ? user!.id : null,
    });

    const response = NextResponse.json({
      ok: true,
      appointmentId: result.appointmentId,
      sync_status: result.syncStatus,
      status: result.status,
      requiresIntake: result.requiresIntake,
      resumeUrl: "/programare/status",
    });

    const sessionToken = createAppointmentResumeToken({
      appointmentId: result.appointmentId,
      email: bookingEmail,
    });

    response.cookies.set({
      ...getAppointmentResumeCookieOptions(sessionToken.expiresAt),
      value: sessionToken.value,
    });

    await writeSecurityAuditEvent({
      action: "booking.appointment.create",
      entityId: result.appointmentId,
      entityType: "appointment",
      ip: auditContext.ip,
      metadata: {
        firstVisit: parsed.prima_vizita === "Da",
        serviceSlug: parsed.service,
        source: patientAccount ? "patient_account" : "public_site",
      },
      result: "allowed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return response;
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "booking.appointment.create",
      entityType: "appointment",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : String(error),
      },
      result:
        error instanceof Error && error.name === "InvalidOriginError"
          ? "blocked"
          : error instanceof Error && error.name === "RateLimitExceededError"
            ? "blocked"
            : "failed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut procesa programarea.",
      },
      { status: 400 },
    );
  }
}
