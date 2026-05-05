import { createHash } from "node:crypto";

import { hasServerEnv } from "@/lib/env/server";
import { RateLimitExceededError } from "@/lib/security/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const memoryStore = new Map<string, number[]>();

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function applyRateLimit({
  key,
  identifier,
  max,
  windowMs,
}: {
  key: string;
  identifier: string;
  max: number;
  windowMs: number;
}) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const scopedKey = `${key}:${identifier}`;

  const cached = memoryStore.get(scopedKey) ?? [];
  const recentHits = cached.filter((timestamp) => timestamp >= windowStart);

  if (recentHits.length >= max) {
    throw new RateLimitExceededError();
  }
  const hashedIdentifier = hashValue(identifier);

  if (!hasServerEnv()) {
    recentHits.push(now);
    memoryStore.set(scopedKey, recentHits);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("endpoint_key", key)
    .eq("hashed_identifier", hashedIdentifier)
    .gte("created_at", new Date(windowStart).toISOString());

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= max) {
    throw new RateLimitExceededError();
  }

  const { error: insertError } = await supabase
    .from("rate_limit_events")
    .insert({
      endpoint_key: key,
      hashed_identifier: hashedIdentifier,
      created_at: new Date(now).toISOString(),
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  recentHits.push(now);
  memoryStore.set(scopedKey, recentHits);
}
