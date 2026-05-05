import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env/server";
import { getCurrentSessionUser } from "@/modules/auth/guards";

function buildSessionUser(user: Awaited<ReturnType<typeof getCurrentSessionUser>>) {
  if (!user) {
    return null;
  }

  const metadataName = String(
    user.user_metadata.full_name ?? user.user_metadata.name ?? "",
  ).trim();
  const displayName =
    metadataName ||
    (user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Cont");
  const avatar =
    user.user_metadata.avatar_url ??
    user.user_metadata.picture ??
    user.user_metadata.photo_url;

  return {
    avatarUrl: typeof avatar === "string" && avatar.trim() ? avatar : null,
    displayName,
    email: user.email ?? null,
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: true, user: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await getCurrentSessionUser();

  return NextResponse.json(
    {
      ok: true,
      user: buildSessionUser(user),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
