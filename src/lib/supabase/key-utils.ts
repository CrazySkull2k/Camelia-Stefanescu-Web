const URL_PREFIX = /^https?:\/\//i;

export function isSupabaseApiKey(value?: string | null) {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || URL_PREFIX.test(trimmed)) {
    return false;
  }

  return trimmed.startsWith("sb_publishable_") || trimmed.startsWith("eyJ");
}

export function getSupabasePublicKeyError(value?: string | null) {
  if (!value?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY lipseste.";
  }

  if (URL_PREFIX.test(value)) {
    return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contine URL-ul proiectului, nu cheia publishable/anon.";
  }

  return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nu pare sa fie o cheie Supabase valida.";
}
