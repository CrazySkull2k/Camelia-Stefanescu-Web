import { getPublicSiteUrl } from "@/lib/env/client";

import { InvalidOriginError } from "@/lib/security/errors";

export type AppOriginSurface =
  | "account"
  | "admin"
  | "any"
  | "public"
  | "public-or-account";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

function resolveConfiguredOrigin(value: string, fallbackProtocol: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeOrigin(new URL(trimmed).origin);
  }

  return normalizeOrigin(`${fallbackProtocol}//${trimmed}`);
}

function getPublicOriginAliases(origin: string) {
  const aliases = new Set<string>([origin]);
  const url = new URL(origin);

  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
    aliases.add(normalizeOrigin(url.origin));
  } else {
    url.hostname = `www.${url.hostname}`;
    aliases.add(normalizeOrigin(url.origin));
  }

  return aliases;
}

function getAllowedOriginsBySurface() {
  const publicOrigin = new URL(getPublicSiteUrl()).origin;
  const protocol = new URL(publicOrigin).protocol;
  const normalizedPublicOrigin = normalizeOrigin(publicOrigin);

  const adminOrigin = resolveConfiguredOrigin(process.env.ADMIN_HOSTNAME ?? "", protocol);
  const accountOrigin = resolveConfiguredOrigin(process.env.ACCOUNT_HOSTNAME ?? "", protocol);
  const adminOrigins = new Set<string>([
    adminOrigin ?? normalizedPublicOrigin,
  ]);
  const accountOrigins = new Set<string>([
    accountOrigin ?? normalizedPublicOrigin,
  ]);
  const publicOrigins = getPublicOriginAliases(normalizedPublicOrigin);
  const publicOrAccountOrigins = new Set<string>([
    ...publicOrigins,
    ...accountOrigins,
  ]);
  const allOrigins = new Set<string>([
    ...publicOrigins,
    ...adminOrigins,
    ...accountOrigins,
  ]);

  return {
    account: accountOrigins,
    admin: adminOrigins,
    any: allOrigins,
    public: publicOrigins,
    "public-or-account": publicOrAccountOrigins,
  } satisfies Record<AppOriginSurface, Set<string>>;
}

export function assertAllowedOrigin(
  origin: string | null,
  surface: AppOriginSurface = "any",
) {
  if (!origin) {
    throw new Error("Missing origin header.");
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOriginsBySurface()[surface];

  if (!allowedOrigins.has(normalizedOrigin)) {
    throw new InvalidOriginError("Origin mismatch.");
  }
}
