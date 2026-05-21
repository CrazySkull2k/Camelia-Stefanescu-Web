import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env/server";
import { buildRequestUrl } from "@/lib/http/request-url";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";

const LOGIN_FAILED_MESSAGE =
  "Datele de autentificare sunt invalide sau contul nu este disponibil.";
const AUTH_UNAVAILABLE_MESSAGE =
  "Serviciul de autentificare nu este disponibil momentan.";

function buildLoginRedirect(request: Request, input?: {
  email?: string | null;
  error?: string | null;
  redirectTo?: string | null;
}) {
  const url = buildRequestUrl(request, "/cont/autentificare");

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
    assertAllowedOrigin(request.headers.get("origin"), "account");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "auth.login",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "account",
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
        error: AUTH_UNAVAILABLE_MESSAGE,
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
        surface: "account",
        userAgent: auditContext.userAgent,
      });

      return NextResponse.redirect(
        buildLoginRedirect(request, {
          email,
          error: LOGIN_FAILED_MESSAGE,
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
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildRequestUrl(
        request,
        redirectTo.startsWith("/") ? redirectTo : "/cont/dashboard",
      ),
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
          error instanceof Error && error.name === "RateLimitExceededError"
            ? error.message
            : LOGIN_FAILED_MESSAGE,
        redirectTo,
      }),
      { status: 303 },
    );
  }
}
