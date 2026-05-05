import "server-only";

import { createHash } from "node:crypto";

import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/logger";

type SecurityAuditSurface = "account" | "admin" | "public" | "system";
type SecurityAuditResult = "allowed" | "blocked" | "failed" | "succeeded";

function hashValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().slice(0, 160);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => sanitizeMetadataValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 12)
        .map(([key, entry]) => [key, sanitizeMetadataValue(entry)]),
    );
  }

  return String(value).slice(0, 160);
}

export function getRequestAuditContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;

  return {
    ip,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function writeSecurityAuditEvent(input: {
  action: string;
  actorUserId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  result: SecurityAuditResult;
  surface: SecurityAuditSurface;
  userAgent?: string | null;
}) {
  if (!hasServerEnv()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("security_audit_events").insert({
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    entity_id: input.entityId ?? null,
    entity_type: input.entityType ?? null,
    hashed_ip: hashValue(input.ip),
    hashed_user_agent: hashValue(input.userAgent),
    metadata: input.metadata ? sanitizeMetadataValue(input.metadata) : null,
    result: input.result,
    surface: input.surface,
  });

  if (error) {
    log("error", "Failed to write security audit event", {
      action: input.action,
      error: error.message,
      surface: input.surface,
    });
  }
}
