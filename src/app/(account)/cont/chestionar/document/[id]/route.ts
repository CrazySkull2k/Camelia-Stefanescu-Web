import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { buildRequestUrl } from "@/lib/http/request-url";
import { streamPrivateStorageFile } from "@/lib/http/private-file-response";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { isUuid } from "@/lib/validation/uuid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentPatientAccount } from "@/modules/patients/account";

type PatientQuestionnaireDocumentRouteProps = {
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
  { params }: PatientQuestionnaireDocumentRouteProps,
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
      buildRequestUrl(request, "/cont/autentificare?redirectTo=/cont/chestionar"),
      { status: 303 },
    );
  }

  const { id } = await params;

  if (!isUuid(id)) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.preview",
      actorUserId: user.id,
      entityId: id,
      entityType: "generated_document",
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
    key: "account:questionnaire:preview",
    max: 40,
    windowMs: 5 * 60 * 1000,
  });

  const supabase = createSupabaseAdminClient();
  const { data: document } = await supabase
    .from("generated_documents")
    .select("id, patient_id, storage_bucket, storage_path")
    .eq("id", id)
    .eq("patient_id", patient.id)
    .eq("document_type", "nutrition_questionnaire_pdf")
    .maybeSingle();

  if (!document?.storage_bucket || !document.storage_path) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.preview",
      actorUserId: user.id,
      entityId: id,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { reason: "missing-or-unauthorized" },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const response = await streamPrivateStorageFile({
    bucket: document.storage_bucket,
    disposition: "inline",
    fallbackName: "chestionar-evaluare-nutritionala.pdf",
    filename: "chestionar-evaluare-nutritionala.pdf",
    path: document.storage_path,
    supabase,
  });

  if (!response) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.preview",
      actorUserId: user.id,
      entityId: document.id,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { reason: "storage-download-failed" },
      result: "failed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  await writeSecurityAuditEvent({
    action: "patient.questionnaire.preview",
    actorUserId: user.id,
    entityId: document.id,
    entityType: "generated_document",
    ip: auditContext.ip,
    result: "allowed",
    surface: "account",
    userAgent: auditContext.userAgent,
  });

  return response;
}
