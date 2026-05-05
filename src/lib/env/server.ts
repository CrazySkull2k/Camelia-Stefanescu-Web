import { z } from "zod";

import {
  getSupabasePublicKeyError,
  isSupabaseApiKey,
} from "@/lib/supabase/key-utils";

const plainEmailSchema = z.string().email();

function isFriendlyEmailAddress(value: string) {
  const trimmed = value.trim();

  if (plainEmailSchema.safeParse(trimmed).success) {
    return true;
  }

  const friendlyMatch = trimmed.match(/^([^<>]+)\s<([^<>]+)>$/);
  if (!friendlyMatch) {
    return false;
  }

  return plainEmailSchema.safeParse(friendlyMatch[2]?.trim()).success;
}

const resendFromEmailSchema = z.string().trim().min(1).refine(isFriendlyEmailAddress, {
  message: "Invalid sender email address",
});

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_ALLOWED_GOOGLE_EMAILS: z.string().min(1).optional(),
  ADMIN_HOSTNAME: z.string().min(1).optional(),
  ACCOUNT_HOSTNAME: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: resendFromEmailSchema,
  ADMIN_NOTIFICATION_EMAIL: z.string().email(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_ID: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1),
  GOOGLE_CALENDAR_WEBHOOK_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  APPOINTMENT_RESUME_SECRET: z.string().min(1).optional(),
  QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  PDF_CHROMIUM_EXECUTABLE_PATH: z.string().min(1).optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
const supabaseEnvSchema = serverEnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true,
  SUPABASE_SERVICE_ROLE_KEY: true,
});

const googleCalendarEnvSchema = serverEnvSchema.pick({
  GOOGLE_CALENDAR_ID: true,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: true,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: true,
});

const resendEnvSchema = serverEnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: true,
  SUPABASE_SERVICE_ROLE_KEY: true,
  RESEND_API_KEY: true,
  RESEND_FROM_EMAIL: true,
  ADMIN_NOTIFICATION_EMAIL: true,
  RESEND_WEBHOOK_SECRET: true,
});
const pdfEnvSchema = serverEnvSchema.pick({
  PDF_CHROMIUM_EXECUTABLE_PATH: true,
});

type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;
type GoogleCalendarEnv = z.infer<typeof googleCalendarEnvSchema>;
type ResendEnv = z.infer<typeof resendEnvSchema>;
type PdfEnv = z.infer<typeof pdfEnvSchema>;

function buildServerEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_ALLOWED_GOOGLE_EMAILS: process.env.ADMIN_ALLOWED_GOOGLE_EMAILS,
    ADMIN_HOSTNAME: process.env.ADMIN_HOSTNAME,
    ACCOUNT_HOSTNAME: process.env.ACCOUNT_HOSTNAME,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    GOOGLE_CALENDAR_WEBHOOK_TOKEN: process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    APPOINTMENT_RESUME_SECRET: process.env.APPOINTMENT_RESUME_SECRET,
    QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY:
      process.env.QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    PDF_CHROMIUM_EXECUTABLE_PATH: process.env.PDF_CHROMIUM_EXECUTABLE_PATH,
  };
}

let cachedEnv: ServerEnv | null = null;
let cachedSupabaseEnv: SupabaseEnv | null = null;
let cachedGoogleCalendarEnv: GoogleCalendarEnv | null = null;
let cachedResendEnv: ResendEnv | null = null;
let cachedPdfEnv: PdfEnv | null = null;

function hasSupabaseServerAuthKey(env: Pick<
  SupabaseEnv,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SERVICE_ROLE_KEY"
>) {
  return isSupabaseApiKey(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function assertSupabaseServerAuthKey(env: Pick<
  SupabaseEnv,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SERVICE_ROLE_KEY"
>) {
  if (hasSupabaseServerAuthKey(env)) {
    return;
  }

  throw new Error(
    `${getSupabasePublicKeyError(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)} Configureaza cheia publishable/anon din Supabase Dashboard > Connect sau API Keys. SSR si proxy nu mai au voie sa foloseasca SUPABASE_SERVICE_ROLE_KEY.`,
  );
}

export function hasServerEnv() {
  return hasSupabaseEnv();
}

export function hasSupabaseEnv() {
  const parsed = supabaseEnvSchema.safeParse(buildServerEnv());
  return parsed.success && hasSupabaseServerAuthKey(parsed.data);
}

export function hasGoogleCalendarEnv() {
  return googleCalendarEnvSchema.safeParse(buildServerEnv()).success;
}

export function hasResendEnv() {
  return resendEnvSchema.safeParse(buildServerEnv()).success;
}

export function getServerEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = serverEnvSchema.parse(buildServerEnv());
  return cachedEnv;
}

export function getSupabaseEnv() {
  if (cachedSupabaseEnv) {
    return cachedSupabaseEnv;
  }

  cachedSupabaseEnv = supabaseEnvSchema.parse(buildServerEnv());
  assertSupabaseServerAuthKey(cachedSupabaseEnv);
  return cachedSupabaseEnv;
}

export function hasSupabaseBrowserEnv() {
  return isSupabaseApiKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getGoogleCalendarEnv() {
  if (cachedGoogleCalendarEnv) {
    return cachedGoogleCalendarEnv;
  }

  cachedGoogleCalendarEnv = googleCalendarEnvSchema.parse(buildServerEnv());
  return cachedGoogleCalendarEnv;
}

export function getResendEnv() {
  if (cachedResendEnv) {
    return cachedResendEnv;
  }

  cachedResendEnv = resendEnvSchema.parse(buildServerEnv());
  return cachedResendEnv;
}

export function getPdfEnv() {
  if (cachedPdfEnv) {
    return cachedPdfEnv;
  }

  cachedPdfEnv = pdfEnvSchema.parse(buildServerEnv());
  return cachedPdfEnv;
}
