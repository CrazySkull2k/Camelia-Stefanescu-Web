import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  getCurrentPatientAccount,
  updateCurrentPatientProfile,
} from "@/modules/patients/account";

function buildProfileRedirect(request: Request, input?: {
  error?: string | null;
  success?: string | null;
}) {
  const url = new URL("/cont/profil", request.url);

  if (input?.success) {
    url.searchParams.set("success", input.success);
  }

  if (input?.error) {
    url.searchParams.set("error", input.error);
  }

  return url;
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "account");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "patient.profile.update",
      entityType: "patient_profile",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildProfileRedirect(request, {
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    return NextResponse.redirect(
      new URL("/cont/autentificare?redirectTo=/cont/profil", request.url),
      { status: 303 },
    );
  }

  const formData = await request.formData();

  try {
    await applyRateLimit({
      identifier: `${user.id}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "account:profile:update",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    await updateCurrentPatientProfile({
      birthDate: String(formData.get("birth_date") ?? ""),
      fullName: String(formData.get("full_name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      sex: String(formData.get("sex") ?? ""),
    });

    await writeSecurityAuditEvent({
      action: "patient.profile.update",
      actorUserId: user.id,
      entityId: patient.id,
      entityType: "patient_profile",
      ip: auditContext.ip,
      result: "allowed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildProfileRedirect(request, {
        success: "Profilul a fost actualizat.",
      }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to update patient profile through BFF route", {
      error: error instanceof Error ? error.message : String(error),
      patientId: patient.id,
      userId: user.id,
    });

    await writeSecurityAuditEvent({
      action: "patient.profile.update",
      actorUserId: user.id,
      entityId: patient.id,
      entityType: "patient_profile",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : String(error),
      },
      result: "failed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildProfileRedirect(request, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut actualiza profilul.",
      }),
      { status: 303 },
    );
  }
}
