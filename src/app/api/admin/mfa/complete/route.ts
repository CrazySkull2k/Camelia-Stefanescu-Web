import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getOptionalAdminAal2User } from "@/modules/auth/guards";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "mfa.admin.complete",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const adminUser = await getOptionalAdminAal2User();
  if (!adminUser) {
    await writeSecurityAuditEvent({
      action: "mfa.admin.complete",
      entityType: "auth",
      ip: auditContext.ip,
      metadata: {
        reason: "aal2-required",
      },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await applyRateLimit({
    identifier: getRequestIdentifier(request, adminUser.id),
    key: "admin:mfa:complete",
    max: 20,
    windowMs: 5 * 60 * 1000,
  });

  await writeSecurityAuditEvent({
    action: "mfa.admin.complete",
    actorUserId: adminUser.id,
    entityType: "auth",
    ip: auditContext.ip,
    metadata: {
      method: "totp",
    },
    result: "allowed",
    surface: "admin",
    userAgent: auditContext.userAgent,
  });

  return NextResponse.json({ ok: true });
}
