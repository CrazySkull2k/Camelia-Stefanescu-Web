import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env/server";
import { getRequestUrl } from "@/lib/http/request-url";
import { createSupabaseMutableServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const redirectUrl = getRequestUrl(request);
  const next = request.nextUrl.searchParams.get("next") ?? "/cont/dashboard";

  if (!hasSupabaseEnv()) {
    redirectUrl.pathname = "/cont/autentificare";
    redirectUrl.searchParams.set("error", "Supabase nu este configurat.");
    return NextResponse.redirect(redirectUrl);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createSupabaseMutableServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      redirectUrl.pathname = next;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    redirectUrl.pathname = "/cont/autentificare";
    redirectUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = "/cont/autentificare";
  redirectUrl.searchParams.set("error", "Link-ul de confirmare este invalid.");
  return NextResponse.redirect(redirectUrl);
}
