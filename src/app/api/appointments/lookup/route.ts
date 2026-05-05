import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAppointmentResumeToken,
  getAppointmentResumeCookieOptions,
} from "@/lib/security/appointment-session";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { lookupAppointmentByReference } from "@/modules/appointments/service";

const appointmentLookupSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().min(4).max(32),
});

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request.headers.get("origin"), "public");

    const formData = await request.formData();
    const parsed = appointmentLookupSchema.parse({
      email: formData.get("email"),
      code: formData.get("code"),
    });

    await applyRateLimit({
      key: "appointments:lookup",
      identifier: `${request.headers.get("x-forwarded-for") ?? "local"}:${parsed.email}`,
      max: 8,
      windowMs: 10 * 60 * 1000,
    });

    const appointment = await lookupAppointmentByReference({
      email: parsed.email,
      code: parsed.code,
    });

    if (!appointment) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Nu am putut identifica programarea pe baza emailului si a codului primite.",
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      resumeUrl: "/programare/status",
    });
    const sessionToken = createAppointmentResumeToken({
      appointmentId: appointment.id,
      email: parsed.email,
    });

    response.cookies.set({
      ...getAppointmentResumeCookieOptions(sessionToken.expiresAt),
      value: sessionToken.value,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut verifica programarea.",
      },
      { status: 400 },
    );
  }
}
