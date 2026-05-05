import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentSessionUser,
  getOptionalAdminUser,
} from "@/modules/auth/guards";
import { sanitizePlainText } from "@/lib/validation/sanitize";

const allowedFolders = new Set(["site-media", "blog-covers"]);

function sanitizeFilename(filename: string) {
  return sanitizePlainText(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { ok: false, error: "Supabase nu este configurat." },
      { status: 503 },
    );
  }

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cerere invalida.",
      },
      { status: 400 },
    );
  }

  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Acces neautorizat." }, { status: 401 });
  }

  const user = await getOptionalAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Acces neautorizat." }, { status: 403 });
  }

  await applyRateLimit({
    identifier: `${user.id}:${request.headers.get("x-forwarded-for") ?? "local"}`,
    key: "admin:uploads:sign",
    max: 60,
    windowMs: 5 * 60 * 1000,
  });

  const body = (await request.json()) as {
    filename?: string;
    folder?: string;
  };

  const filename = sanitizeFilename(body.filename?.trim() ?? "");
  if (!filename) {
    return NextResponse.json(
      { ok: false, error: "Lipseste numele fisierului." },
      { status: 400 },
    );
  }

  const folder = allowedFolders.has(body.folder ?? "") ? body.folder! : "site-media";
  const storagePath = `${Date.now()}-${filename}`;
  const publicPath = `${folder}/${storagePath}`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(folder)
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    bucket: folder,
    path: publicPath,
    publicPath,
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
  });
}
