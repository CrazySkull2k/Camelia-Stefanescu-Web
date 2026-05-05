import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  getCurrentSessionUser,
  getOptionalAdminUser,
} from "@/modules/auth/guards";

function sanitizeRedirectTo(value: string | null) {
  return value && value.startsWith("/") ? value : "/admin";
}

function buildAdminDeniedRedirect(request: Request, message: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", message);
  return url;
}

export async function GET(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const auditContext = getRequestAuditContext(request);
  const url = new URL(request.url);
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
        redirectTo,
      },
      result: "allowed",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });
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

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
