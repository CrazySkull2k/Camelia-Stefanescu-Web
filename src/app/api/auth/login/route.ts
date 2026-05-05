import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env/server";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";

function buildLoginRedirect(request: Request, input?: {
  email?: string | null;
  error?: string | null;
  redirectTo?: string | null;
}) {
  const url = new URL("/cont/autentificare", request.url);

  if (input?.redirectTo && input.redirectTo.startsWith("/")) {
    url.searchParams.set("redirectTo", input.redirectTo);
  }

  if (input?.email) {
    url.searchParams.set("email", input.email);
  }

  if (input?.error) {
    url.searchParams.set("error", input.error);
  }

  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/cont/dashboard");
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "public");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "auth.login",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildLoginRedirect(request, {
        email,
        error: error instanceof Error ? error.message : "Cerere invalida.",
        redirectTo,
      }),
      { status: 303 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      buildLoginRedirect(request, {
        email,
        error: "Supabase nu este configurat.",
        redirectTo,
      }),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: `${email || "anonymous"}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "auth:login",
      max: 15,
      windowMs: 5 * 60 * 1000,
    });

    const supabase = await createSupabaseMutableServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await writeSecurityAuditEvent({
        action: "auth.login",
        entityType: "auth",
        ip: auditContext.ip,
        metadata: {
          reason: error.message,
        },
        result: "failed",
        surface: "public",
        userAgent: auditContext.userAgent,
      });

      return NextResponse.redirect(
        buildLoginRedirect(request, {
          email,
          error: error.message,
          redirectTo,
        }),
        { status: 303 },
      );
    }

    await writeSecurityAuditEvent({
      action: "auth.login",
      entityType: "auth",
      ip: auditContext.ip,
      result: "allowed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      new URL(redirectTo.startsWith("/") ? redirectTo : "/cont/dashboard", request.url),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to log in patient account", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildLoginRedirect(request, {
        email,
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut autentifica sesiunea.",
        redirectTo,
      }),
      { status: 303 },
    );
  }
}
