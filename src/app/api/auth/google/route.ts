import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env/server";
import {
  InvalidOriginError,
  RateLimitExceededError,
} from "@/lib/security/errors";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentSessionUser } from "@/modules/auth/guards";

function sanitizeRedirectTo(value: string | null | undefined) {
  return value && value.startsWith("/") ? value : "/cont/dashboard";
}

function resolveAuthSurface(redirectTo: string) {
  if (redirectTo.startsWith("/admin")) {
    return "admin" as const;
  }

  if (redirectTo.startsWith("/cont")) {
    return "account" as const;
  }

  return "public" as const;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { redirectTo?: string }
    | null;
  const redirectTo = sanitizeRedirectTo(body?.redirectTo ?? null);
  const surface = resolveAuthSurface(redirectTo);
  const requestOrigin = request.headers.get("origin");
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(requestOrigin, surface);

    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase nu este configurat.", ok: false },
        { status: 503 },
      );
    }

    const user = await getCurrentSessionUser();

    await applyRateLimit({
      identifier: `${user?.id ?? "anonymous"}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key:
        surface === "admin"
          ? "auth:google:init:admin"
          : "auth:google:init:public",
      max: surface === "admin" ? 12 : 20,
      windowMs: 5 * 60 * 1000,
    });

    const callbackUrl = new URL("/auth/callback", requestOrigin ?? request.url);
    callbackUrl.searchParams.set("redirectTo", redirectTo);

    const supabase = await createSupabaseMutableServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
      provider: "google",
    });

    if (error || !data?.url) {
      throw new Error(
        error?.message ?? "Nu am putut initializa autentificarea Google.",
      );
    }

    await writeSecurityAuditEvent({
      action: "auth.google.init",
      actorUserId: user?.id ?? null,
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        redirectTo,
      },
      result: "allowed",
      surface,
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json({ ok: true, url: data.url });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    const status =
      error instanceof InvalidOriginError || errorName === "InvalidOriginError"
        ? 400
        : error instanceof RateLimitExceededError ||
            errorName === "RateLimitExceededError"
          ? 429
          : 400;
    const result =
      error instanceof InvalidOriginError ||
      error instanceof RateLimitExceededError ||
      errorName === "InvalidOriginError" ||
      errorName === "RateLimitExceededError"
        ? "blocked"
        : "failed";

    log("error", "Failed to start Google OAuth flow", {
      error: error instanceof Error ? error.message : String(error),
      redirectTo,
      surface,
    });

    await writeSecurityAuditEvent({
      action: "auth.google.init",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : String(error),
        redirectTo,
      },
      result,
      surface,
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut initializa autentificarea Google.",
        ok: false,
      },
      { status },
    );
  }
}
