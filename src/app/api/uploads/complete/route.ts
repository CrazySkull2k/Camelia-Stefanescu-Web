import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import {
  getCurrentSessionUser,
  getOptionalAdminUser,
} from "@/modules/auth/guards";

const allowedBuckets = new Set(["site-media", "blog-covers"]);

function sanitizeStoragePath(value: string) {
  return sanitizePlainText(value)
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
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
    key: "admin:uploads:complete",
    max: 60,
    windowMs: 5 * 60 * 1000,
  });

  const body = (await request.json()) as {
    altText?: string;
    bucket?: string;
    kind?: string;
    publicPath?: string;
    storagePath?: string;
  };

  const bucket = sanitizePlainText(body.bucket?.trim() ?? "");
  const storagePath = sanitizeStoragePath(body.storagePath?.trim() ?? "");
  const publicPath = sanitizeStoragePath(body.publicPath?.trim() ?? "");
  const expectedPublicPath = bucket && storagePath ? `${bucket}/${storagePath}` : "";

  if (!allowedBuckets.has(bucket) || !storagePath || publicPath !== expectedPublicPath) {
    return NextResponse.json(
      { ok: false, error: "Fisierul incarcat nu este valid." },
      { status: 400 },
    );
  }

  const kind = sanitizePlainText(body.kind?.trim() ?? "image") || "image";
  const altText = sanitizePlainText(body.altText?.trim() ?? "");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("media_assets").upsert(
    {
      alt_text: altText || null,
      bucket_name: bucket,
      kind,
      owner_user_id: user.id,
      storage_path: publicPath,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "storage_path" },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, publicPath });
}
