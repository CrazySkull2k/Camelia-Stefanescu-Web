import { NextResponse } from "next/server";

import {
  createAppointmentResumeToken,
  getAppointmentResumeCookieOptions,
  verifyAppointmentResumeToken,
} from "@/lib/security/appointment-session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const payload = verifyAppointmentResumeToken(token);

  if (!payload) {
    return NextResponse.redirect(
      new URL("/programare/status?lookup=1&reason=invalid-link", origin),
    );
  }

  const refreshedToken = createAppointmentResumeToken({
    appointmentId: payload.appointmentId,
    email: payload.email,
  });
  const response = NextResponse.redirect(new URL("/programare/status", origin));

  response.cookies.set({
    ...getAppointmentResumeCookieOptions(refreshedToken.expiresAt),
    value: refreshedToken.value,
  });

  return response;
}
