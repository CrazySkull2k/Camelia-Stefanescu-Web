"use client";

export function createSupabaseBrowserClient(): never {
  throw new Error(
    "Direct Supabase browser access is disabled. Foloseste route handlers / BFF endpoints ale aplicatiei.",
  );
}
