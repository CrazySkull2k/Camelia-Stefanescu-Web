import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { streamPrivateStorageFile } from "@/lib/http/private-file-response";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { isUuid } from "@/lib/validation/uuid";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PatientAnalysisDownloadRouteProps = {
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
  { params }: PatientAnalysisDownloadRouteProps,
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
  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    return NextResponse.redirect(
      new URL("/cont/autentificare?redirectTo=/cont/analize", request.url),
      { status: 303 },
    );
  }

  const { id } = await params;

  if (!isUuid(id)) {
    await writeSecurityAuditEvent({
      action: "patient.analysis.download",
      actorUserId: user.id,
      entityId: id,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: { reason: "invalid-id" },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await applyRateLimit({
    identifier: buildRequestIdentifier(request, user.id),
    key: "account:analyses:download",
    max: 30,
    windowMs: 5 * 60 * 1000,
  });

  const supabase = createSupabaseAdminClient();
  const { data: upload } = await supabase
    .from("patient_analysis_uploads")
    .select(
      "id, patient_id, original_filename, content_type, storage_bucket, storage_path",
    )
    .eq("id", id)
    .eq("patient_id", patient.id)
    .maybeSingle();

  if (!upload?.storage_bucket || !upload.storage_path) {
    await writeSecurityAuditEvent({
      action: "patient.analysis.download",
      actorUserId: user.id,
      entityId: id,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: { reason: "missing-or-unauthorized" },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const response = await streamPrivateStorageFile({
    bucket: upload.storage_bucket,
    contentType: upload.content_type,
    disposition: "attachment",
    fallbackName: "analiza",
    filename: upload.original_filename,
    path: upload.storage_path,
    supabase,
  });

  if (!response) {
    await writeSecurityAuditEvent({
      action: "patient.analysis.download",
      actorUserId: user.id,
      entityId: id,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: { reason: "storage-download-failed" },
      result: "failed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await writeSecurityAuditEvent({
    action: "patient.analysis.download",
    actorUserId: user.id,
    entityId: upload.id,
    entityType: "patient_analysis_upload",
    ip: auditContext.ip,
    metadata: {
      contentType: upload.content_type,
    },
    result: "allowed",
    surface: "account",
    userAgent: auditContext.userAgent,
  });

  return response;
}
