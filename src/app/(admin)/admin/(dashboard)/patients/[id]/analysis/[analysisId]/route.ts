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

type PatientAnalysisRouteProps = {
  params: Promise<{ analysisId: string; id: string }>;
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
  { params }: PatientAnalysisRouteProps,
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

  const { analysisId, id } = await params;

  if (!isUuid(id) || !isUuid(analysisId)) {
    await writeSecurityAuditEvent({
      action: "admin.patient.analysis.preview",
      actorUserId: adminUser.id,
      entityId: analysisId,
      entityType: "patient_analysis_upload",
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
    key: "admin:patient-analysis:preview",
    max: 80,
    windowMs: 5 * 60 * 1000,
  });

  const supabase = createSupabaseAdminClient();
  const { data: analysis } = await supabase
    .from("patient_analysis_uploads")
    .select(
      "id, patient_id, original_filename, content_type, storage_bucket, storage_path",
    )
    .eq("id", analysisId)
    .eq("patient_id", id)
    .maybeSingle();

  if (!analysis?.storage_bucket || !analysis.storage_path) {
    await writeSecurityAuditEvent({
      action: "admin.patient.analysis.preview",
      actorUserId: adminUser.id,
      entityId: analysisId,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: { patientId: id, reason: "missing-or-unauthorized" },
      result: "blocked",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const response = await streamPrivateStorageFile({
    bucket: analysis.storage_bucket,
    contentType: analysis.content_type,
    disposition: "inline",
    fallbackName: "analiza",
    filename: analysis.original_filename,
    path: analysis.storage_path,
    supabase,
  });

  if (!response) {
    await writeSecurityAuditEvent({
      action: "admin.patient.analysis.preview",
      actorUserId: adminUser.id,
      entityId: analysisId,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: { patientId: id, reason: "storage-download-failed" },
      result: "failed",
      surface: "admin",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await writeSecurityAuditEvent({
    action: "admin.patient.analysis.preview",
    actorUserId: adminUser.id,
    entityId: analysisId,
    entityType: "patient_analysis_upload",
    ip: auditContext.ip,
    metadata: { patientId: id },
    result: "allowed",
    surface: "admin",
    userAgent: auditContext.userAgent,
  });

  return response;
}
