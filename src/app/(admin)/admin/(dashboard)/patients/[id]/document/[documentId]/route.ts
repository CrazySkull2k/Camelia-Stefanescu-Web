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
  getOptionalOwnerAdminAal2User,
} from "@/modules/auth/guards";

type PatientDocumentRouteProps = {
  params: Promise<{ documentId: string; id: string }>;
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
  { params }: PatientDocumentRouteProps,
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

  const adminUser = await getOptionalOwnerAdminAal2User();
  if (!adminUser) {
    return notFoundResponse();
  }

  const { documentId, id } = await params;

  if (!isUuid(id) || !isUuid(documentId)) {
    await writeSecurityAuditEvent({
      action: "admin.patient.document.preview",
      actorUserId: adminUser.id,
      entityId: documentId,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { patientId: id, reason: "invalid-id" },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await applyRateLimit({
    identifier: buildRequestIdentifier(request, adminUser.id),
    key: "admin:patient-document:preview",
    max: 80,
    windowMs: 5 * 60 * 1000,
  });

  const supabase = createSupabaseAdminClient();
  const { data: document } = await supabase
    .from("generated_documents")
    .select("id, patient_id, document_type, storage_bucket, storage_path")
    .eq("id", documentId)
    .eq("patient_id", id)
    .maybeSingle();

  if (!document?.storage_bucket || !document.storage_path) {
    await writeSecurityAuditEvent({
      action: "admin.patient.document.preview",
      actorUserId: adminUser.id,
      entityId: documentId,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { patientId: id, reason: "missing-or-unauthorized" },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const response = await streamPrivateStorageFile({
    bucket: document.storage_bucket,
    disposition: "inline",
    fallbackName: document.document_type || "document-pacient",
    filename: `${document.document_type || "document-pacient"}-${document.id}.pdf`,
    path: document.storage_path,
    supabase,
  });

  if (!response) {
    await writeSecurityAuditEvent({
      action: "admin.patient.document.preview",
      actorUserId: adminUser.id,
      entityId: documentId,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { patientId: id, reason: "storage-download-failed" },
      result: "failed",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await writeSecurityAuditEvent({
    action: "admin.patient.document.preview",
    actorUserId: adminUser.id,
    entityId: documentId,
    entityType: "generated_document",
    ip: auditContext.ip,
    metadata: { patientId: id },
    result: "allowed",
    surface: "admin",
    userAgent: auditContext.userAgent,
  });

  return response;
}
