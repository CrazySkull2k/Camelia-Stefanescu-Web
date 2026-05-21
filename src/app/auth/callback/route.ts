import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { buildRequestUrl, getRequestUrl } from "@/lib/http/request-url";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  getAdminAuthAssurance,
  getCurrentSessionUser,
  getOptionalAdminUser,
} from "@/modules/auth/guards";

function sanitizeRedirectTo(value: string | null) {
  return value && value.startsWith("/") ? value : "/admin";
}

function buildAdminDeniedRedirect(request: Request, message: string) {
  const url = buildRequestUrl(request, "/admin/login");
  url.searchParams.set("error", message);
  return url;
}

export async function GET(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.redirect(buildRequestUrl(request, "/admin/login"));
  }

  const auditContext = getRequestAuditContext(request);
  const url = getRequestUrl(request);
  const code = url.searchParams.get("code");
  const redirectTo = sanitizeRedirectTo(url.searchParams.get("redirectTo"));
  const supabase = await createSupabaseMutableServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (redirectTo.startsWith("/admin")) {
    const currentUser = await getCurrentSessionUser();
    const adminUser = await getOptionalAdminUser();

    if (!adminUser) {
      await writeSecurityAuditEvent({
        action: "auth.google.callback",
        actorUserId: currentUser?.id ?? null,
        entityType: "auth",
        ip: auditContext.ip,
        metadata: {
          reason: "admin-access-denied",
          redirectTo,
        },
        result: "blocked",
        surface: "admin",
        userAgent: auditContext.userAgent,
      });

      await supabase.auth.signOut();

      return NextResponse.redirect(
        buildAdminDeniedRedirect(
          request,
          "Contul Google autentificat nu are acces in admin.",
        ),
      );
    }

    await writeSecurityAuditEvent({
      action: "auth.google.callback",
      actorUserId: adminUser.id,
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        assuranceLevel: "pending",
        redirectTo,
      },
      result: "allowed",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    const assurance = await getAdminAuthAssurance();
    if (!assurance.isAal2) {
      return NextResponse.redirect(buildRequestUrl(request, "/admin/mfa"));
    }
  } else {
    const currentUser = await getCurrentSessionUser();

    await writeSecurityAuditEvent({
      action: "auth.google.callback",
      actorUserId: currentUser?.id ?? null,
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        redirectTo,
      },
      result: "allowed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });
  }

  return NextResponse.redirect(buildRequestUrl(request, redirectTo));
}
