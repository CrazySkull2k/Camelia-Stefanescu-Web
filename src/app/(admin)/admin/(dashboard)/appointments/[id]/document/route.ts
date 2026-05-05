import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { streamPrivateStorageFile } from "@/lib/http/private-file-response";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation/uuid";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  getCurrentSessionUser,
  getOptionalOwnerAdminUser,
} from "@/modules/auth/guards";

type AppointmentDocumentRouteProps = {
  params: Promise<{ id: string }>;
};

function buildRequestIdentifier(request: Request, userId: string) {
  return `${userId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function notFoundResponse() {
  return NextResponse.json(
    { error: "Documentul solicitat nu a fost gasit.", ok: false },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  { params }: AppointmentDocumentRouteProps,
) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configurarea serverului nu este completa.",
      },
      { status: 503 },
    );
  }

  const auditContext = getRequestAuditContext(request);
  const sessionUser = await getCurrentSessionUser();

  if (!sessionUser) {
    return NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
    });
  }

  const adminUser = await getOptionalOwnerAdminUser();
  if (!adminUser) {
    return notFoundResponse();
  }

  const { id } = await params;

  if (!isUuid(id)) {
    await writeSecurityAuditEvent({
      action: "admin.appointment.document.preview",
      actorUserId: adminUser.id,
      entityId: id,
      entityType: "appointment",
      ip: auditContext.ip,
      metadata: { reason: "invalid-id" },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await applyRateLimit({
    identifier: buildRequestIdentifier(request, adminUser.id),
    key: "admin:appointment-document:preview",
    max: 60,
    windowMs: 5 * 60 * 1000,
  });

  const adminClient = createSupabaseAdminClient();
  const { data: appointment } = await adminClient
    .from("appointments")
    .select(
      "id, intake_document_id, generated_documents!appointments_intake_document_id_fkey(id, storage_bucket, storage_path)",
    )
    .eq("id", id)
    .maybeSingle();

  const generatedDocument = Array.isArray(appointment?.generated_documents)
    ? appointment.generated_documents[0]
    : appointment?.generated_documents;

  if (!generatedDocument?.storage_bucket || !generatedDocument.storage_path) {
    await writeSecurityAuditEvent({
      action: "admin.appointment.document.preview",
      actorUserId: adminUser.id,
      entityId: id,
      entityType: "appointment",
      ip: auditContext.ip,
      metadata: { reason: "missing-or-unauthorized" },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const response = await streamPrivateStorageFile({
    bucket: generatedDocument.storage_bucket,
    disposition: "inline",
    fallbackName: `evaluare-nutritionala-${id}.pdf`,
    filename: `evaluare-nutritionala-${id}.pdf`,
    path: generatedDocument.storage_path,
    supabase: adminClient,
  });

  if (!response) {
    await writeSecurityAuditEvent({
      action: "admin.appointment.document.preview",
      actorUserId: adminUser.id,
      entityId: id,
      entityType: "appointment",
      ip: auditContext.ip,
      metadata: { reason: "storage-download-failed" },
      result: "failed",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await writeSecurityAuditEvent({
    action: "admin.appointment.document.preview",
    actorUserId: adminUser.id,
    entityId: id,
    entityType: "appointment",
    ip: auditContext.ip,
    result: "allowed",
    surface: "admin",
    userAgent: auditContext.userAgent,
  });

  return response;
}
