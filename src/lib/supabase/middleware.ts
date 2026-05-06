import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env/server";
import { getSupabaseServerAuthKey } from "@/lib/supabase/server-auth-key";

export async function updateSupabaseSession(
  request: NextRequest,
  requestHeaders?: Headers,
) {
  const buildResponse = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders ?? request.headers,
      },
    });

  if (!hasSupabaseEnv()) {
    return buildResponse();
  }

  const env = getSupabaseEnv();
  const { key: authKey } = await getSupabaseServerAuthKey();
  let response = buildResponse();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    authKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}
