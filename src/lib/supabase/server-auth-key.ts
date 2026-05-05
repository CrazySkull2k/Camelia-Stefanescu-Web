import "server-only";

import { getSupabaseEnv } from "@/lib/env/server";
import {
  getSupabasePublicKeyError,
  isSupabaseApiKey,
} from "@/lib/supabase/key-utils";

type ServerAuthKeyResolution = {
  key: string;
  source: "publishable";
};

let cachedResolution: Promise<ServerAuthKeyResolution> | null = null;

async function probeSupabaseApiKey(url: string, key: string) {
  const response = await fetch(`${url}/auth/v1/settings`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (response.ok) {
    return true;
  }

  const body = await response.text().catch(() => "");

  if (response.status === 401 && /Invalid API key/i.test(body)) {
    return false;
  }

  throw new Error(
    `Nu am putut valida cheia Supabase pentru ${url}. Status ${response.status}.`,
  );
}

async function resolveServerAuthKey(): Promise<ServerAuthKeyResolution> {
  const env = getSupabaseEnv();

  if (
    isSupabaseApiKey(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
    (await probeSupabaseApiKey(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ))
  ) {
    return {
      key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      source: "publishable",
    };
  }

  throw new Error(
    `${getSupabasePublicKeyError(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)} SSR si proxy accepta doar cheia publishable/anon a proiectului Supabase curent.`,
  );
}

export async function getSupabaseServerAuthKey() {
  if (!cachedResolution) {
    cachedResolution = resolveServerAuthKey().catch((error) => {
      cachedResolution = null;
      throw error;
    });
  }

  return cachedResolution;
}
