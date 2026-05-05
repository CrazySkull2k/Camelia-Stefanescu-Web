import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env/server";
import { getSupabaseServerAuthKey } from "@/lib/supabase/server-auth-key";

function createCookieAwareClient(allowCookieWrites: boolean) {
  return async () => {
    const env = getSupabaseEnv();
    const cookieStore = await cookies();
    const { key: authKey } = await getSupabaseServerAuthKey();

    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      authKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            if (!allowCookieWrites) {
              return;
            }

            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );
  };
}

export const createSupabaseServerClient = createCookieAwareClient(false);
export const createSupabaseMutableServerClient = createCookieAwareClient(true);
