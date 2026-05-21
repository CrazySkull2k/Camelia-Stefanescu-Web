import { NextResponse } from "next/server";

import { getPublicSiteUrl } from "@/lib/env/client";
import { hasSupabaseEnv } from "@/lib/env/server";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";

const REGISTER_FAILED_MESSAGE =
  "Nu am putut finaliza crearea contului cu datele primite.";
const REGISTER_UNAVAILABLE_MESSAGE =
  "Serviciul de creare cont nu este disponibil momentan.";

function buildRegisterRedirect(request: Request, input?: {
  email?: string | null;
  error?: string | null;
  redirectTo?: string | null;
}) {
  const url = new URL("/cont/inregistrare", request.url);

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
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/cont/dashboard");
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "account");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "auth.register",
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
      buildRegisterRedirect(request, {
        email,
        error: error instanceof Error ? error.message : "Cerere invalida.",
        redirectTo,
      }),
      { status: 303 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      buildRegisterRedirect(request, {
        email,
        error: REGISTER_UNAVAILABLE_MESSAGE,
        redirectTo,
      }),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: `${email || "anonymous"}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "auth:register",
      max: 10,
      windowMs: 10 * 60 * 1000,
    });

    const supabase = await createSupabaseMutableServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${getPublicSiteUrl()}/auth/confirm?next=/cont/dashboard`,
      },
    });

    if (error) {
      await writeSecurityAuditEvent({
        action: "auth.register",
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
        buildRegisterRedirect(request, {
          email,
          error: REGISTER_FAILED_MESSAGE,
          redirectTo,
        }),
        { status: 303 },
      );
    }

    await writeSecurityAuditEvent({
      action: "auth.register",
      entityType: "auth",
      ip: auditContext.ip,
      result: "allowed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    const successUrl = new URL("/cont/autentificare", request.url);
    successUrl.searchParams.set(
      "success",
      "Verifica emailul pentru a-ti confirma contul.",
    );

    return NextResponse.redirect(successUrl, { status: 303 });
  } catch (error) {
    log("error", "Failed to register patient account", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildRegisterRedirect(request, {
        email,
        error:
          error instanceof Error && error.name === "RateLimitExceededError"
            ? error.message
            : REGISTER_FAILED_MESSAGE,
        redirectTo,
      }),
      { status: 303 },
    );
  }
}
