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
import { getCurrentSessionUser } from "@/modules/auth/guards";

function getRequestIdentifier(request: Request, userId: string | null) {
  return `${userId ?? "anonymous"}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"));
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "auth.signout",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cerere invalida.",
        ok: false,
      },
      { status: 400 },
    );
  }

  try {
    const user = hasSupabaseEnv() ? await getCurrentSessionUser() : null;

    await applyRateLimit({
      identifier: getRequestIdentifier(request, user?.id ?? null),
      key: "auth:signout",
      max: 30,
      windowMs: 5 * 60 * 1000,
    });

    if (hasSupabaseEnv()) {
      const supabase = await createSupabaseMutableServerClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    }

    await writeSecurityAuditEvent({
      action: "auth.signout",
      actorUserId: user?.id ?? null,
      entityType: "auth",
      ip: auditContext.ip,
      result: "allowed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log("error", "Failed to sign out current user", {
      error: error instanceof Error ? error.message : String(error),
    });

    await writeSecurityAuditEvent({
      action: "auth.signout",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : String(error),
      },
      result: "failed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      { error: "Nu am putut inchide sesiunea.", ok: false },
      { status: 500 },
    );
  }
}
