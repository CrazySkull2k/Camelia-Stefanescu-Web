import { createBrowserClient } from "@supabase/ssr";

import { getPublicSiteUrl } from "@/lib/env/client";

function getSupabaseBrowserConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase browser environment is not configured for client-side authentication.",
    );
  }

  return {
    supabasePublishableKey,
    supabaseUrl,
  };
}

let cachedClient:
  | ReturnType<typeof createBrowserClient>
  | null = null;

export function createSupabaseBrowserClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const { supabasePublishableKey, supabaseUrl } = getSupabaseBrowserConfig();

  cachedClient = createBrowserClient(supabaseUrl, supabasePublishableKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: getPublicSiteUrl().startsWith("https://"),
    },
  });

  return cachedClient;
}
