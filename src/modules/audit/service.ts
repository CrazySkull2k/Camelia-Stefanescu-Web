import "server-only";

import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(entry: {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  if (!hasServerEnv()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("admin_audit_log").insert({
    actor_user_id: entry.actorId ?? null,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before_state: entry.before ?? null,
    after_state: entry.after ?? null,
  });
}
