"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasServerEnv } from "@/lib/env/server";
import { normalizeEmailForLookup } from "@/lib/security/appointment-session";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";

type NewsletterStatus = "success" | "error" | "unavailable";

const emailSchema = z.string().trim().email().max(254);

function getFormString(formData: FormData, key: string) {
  return sanitizePlainText(String(formData.get(key) ?? "")).trim();
}

function getSafeReturnPath(value: string) {
  const fallback = "/blog";
  const cleaned = value.trim();

  if (!cleaned || !cleaned.startsWith("/") || cleaned.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(cleaned, "https://local.camelia");
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

function buildRedirectPath(returnPath: string, status: NewsletterStatus) {
  const url = new URL(getSafeReturnPath(returnPath), "https://local.camelia");
  url.searchParams.set("newsletter", status);
  url.hash = "newsletter";

  return `${url.pathname}${url.search}${url.hash}`;
}

async function getRequestIdentifier() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "anonymous";
}

export async function subscribeToNewsletter(formData: FormData) {
  const returnPath = getFormString(formData, "redirect_to");
  const sourcePath = getSafeReturnPath(getFormString(formData, "source_path"));
  let status: NewsletterStatus = "error";

  try {
    const parsed = emailSchema.safeParse(getFormString(formData, "email"));
    if (!parsed.success) {
      throw new Error("Email invalid.");
    }

    if (!hasServerEnv()) {
      status = "unavailable";
      throw new Error("Newsletter storage unavailable.");
    }

    const email = parsed.data;
    const normalizedEmail = normalizeEmailForLookup(email);
    const identifier = `${await getRequestIdentifier()}:${normalizedEmail}`;

    await applyRateLimit({
      identifier,
      key: "newsletter-subscribe",
      max: 5,
      windowMs: 60 * 60 * 1000,
    });

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email,
        normalized_email: normalizedEmail,
        source_path: sourcePath,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "normalized_email" },
    );

    if (error) {
      throw new Error(error.message);
    }

    status = "success";
  } catch {
    status = status === "unavailable" ? "unavailable" : "error";
  }

  redirect(buildRedirectPath(returnPath, status));
}
