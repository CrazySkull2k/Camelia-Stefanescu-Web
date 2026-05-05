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
  const { data, error } = await supabase.rpc("enforce_rate_limit", {
    p_endpoint_key: key,
    p_hashed_identifier: hashedIdentifier,
    p_max: max,
    p_window_seconds: Math.max(Math.ceil(windowMs / 1000), 1),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new RateLimitExceededError();
  }

  recentHits.push(now);
  memoryStore.set(scopedKey, recentHits);
}
