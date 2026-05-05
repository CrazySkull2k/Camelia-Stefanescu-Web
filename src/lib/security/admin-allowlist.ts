import "server-only";

import { getServerEnv } from "@/lib/env/server";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getAdminAllowedGoogleEmails() {
  const raw = getServerEnv().ADMIN_ALLOWED_GOOGLE_EMAILS ?? "";

  return new Set(
    raw
      .split(/[,\n;]/)
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean),
  );
}

export function isAdminEmailAllowlisted(email?: string | null) {
  if (!email) {
    return false;
  }

  const allowlist = getAdminAllowedGoogleEmails();
  return allowlist.size > 0 && allowlist.has(normalizeEmail(email));
}

export function hasConfiguredAdminAllowlist() {
  return getAdminAllowedGoogleEmails().size > 0;
}
