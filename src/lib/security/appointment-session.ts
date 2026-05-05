import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env/server";

export const APPOINTMENT_RESUME_COOKIE = "__Host-appointment_resume";
export const BOOKING_MODE_COOKIE = "booking_mode";

const APPOINTMENT_RESUME_TTL_SECONDS = 60 * 60 * 24;

export type BookingMode = "account" | "guest";

type AppointmentResumePayload = {
  appointmentId: string;
  email: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAppointmentResumeSecret() {
  const env = getServerEnv();
  if (env.APPOINTMENT_RESUME_SECRET) {
    return env.APPOINTMENT_RESUME_SECRET;
  }

  throw new Error(
    "APPOINTMENT_RESUME_SECRET trebuie configurat. Secretul de resume nu mai are voie sa reutilizeze SUPABASE_SERVICE_ROLE_KEY.",
  );
}

function signValue(value: string) {
  return createHmac("sha256", getAppointmentResumeSecret())
    .update(value)
    .digest("base64url");
}

export function normalizeEmailForLookup(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeBookingReferenceCode(code: string) {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function randomReferenceChunk() {
  return randomBytes(4)
    .toString("base64url")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 4);
}

export function createPublicReferenceCode() {
  return `${randomReferenceChunk()}-${randomReferenceChunk()}`;
}

export function getPublicReferenceCodeHint(code: string) {
  const normalized = normalizeBookingReferenceCode(code);
  const visible = normalized.slice(-4);
  return `••••-${visible}`;
}

export function hashPublicReferenceCode(code: string) {
  return createHash("sha256")
    .update(normalizeBookingReferenceCode(code))
    .digest("hex");
}

export function createAppointmentResumeToken(input: {
  appointmentId: string;
  email: string;
  expiresAt?: Date;
}) {
  const expiresAt =
    input.expiresAt ?? new Date(Date.now() + APPOINTMENT_RESUME_TTL_SECONDS * 1000);
  const payload = {
    appointmentId: input.appointmentId,
    email: normalizeEmailForLookup(input.email),
    exp: expiresAt.getTime(),
  } satisfies AppointmentResumePayload;
  const serializedPayload = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(serializedPayload);
  const signature = signValue(encodedPayload);

  return {
    value: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

export function verifyAppointmentResumeToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  try {
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as AppointmentResumePayload;

    if (
      !payload.appointmentId ||
      !payload.email ||
      !payload.exp ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getAppointmentResumeFromCookies() {
  const cookieStore = await cookies();
  return verifyAppointmentResumeToken(
    cookieStore.get(APPOINTMENT_RESUME_COOKIE)?.value,
  );
}

export function getAppointmentResumeCookieOptions(expiresAt: Date) {
  return {
    name: APPOINTMENT_RESUME_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
