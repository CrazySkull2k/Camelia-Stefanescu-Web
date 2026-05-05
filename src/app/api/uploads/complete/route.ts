import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  getCurrentSessionUser,
  getOptionalAdminAal2User,
} from "@/modules/auth/guards";

const allowedBuckets = new Set(["site-media", "blog-covers"]);

function sanitizeStoragePath(value: string) {
  return sanitizePlainText(value)
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  if (!hasServerEnv()) {
    return NextResponse.json(
      { ok: false, error: "Supabase nu este configurat." },
      { status: 503 },
    );
  }

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "admin.media.upload.complete",
      entityType: "media_asset",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

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

  const user = await getOptionalAdminAal2User();
  if (!user) {
    await writeSecurityAuditEvent({
      action: "admin.media.upload.complete",
      actorUserId: sessionUser.id,
      entityType: "media_asset",
      ip: auditContext.ip,
      metadata: {
        reason: "aal2-required",
      },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

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

  await writeSecurityAuditEvent({
    action: "admin.media.upload.complete",
    actorUserId: user.id,
    entityType: "media_asset",
    ip: auditContext.ip,
    metadata: {
      bucket,
      publicPath,
    },
    result: "allowed",
    surface: "admin",
    userAgent: auditContext.userAgent,
  });

  return NextResponse.json({ ok: true, publicPath });
}
