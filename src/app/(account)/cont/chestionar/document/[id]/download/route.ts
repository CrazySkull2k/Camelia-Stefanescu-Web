import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { isUuid } from "@/lib/validation/uuid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentPatientAccount } from "@/modules/patients/account";

type PatientQuestionnaireDownloadRouteProps = {
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

function buildContentDisposition(filename: string) {
  const fallback =
    filename
      .replace(/[^\w.\- ]+/g, "")
      .trim()
      .slice(0, 120) || "chestionar-evaluare-nutritionala";

  return `attachment; filename="${fallback.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(
  request: Request,
  { params }: PatientQuestionnaireDownloadRouteProps,
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
    return NextResponse.redirect(new URL("/cont/autentificare", request.url));
  }

  const { id } = await params;

  if (!isUuid(id)) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.download",
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
    key: "account:questionnaire:download",
    max: 30,
    windowMs: 5 * 60 * 1000,
  });

  const supabase = createSupabaseAdminClient();
  const { data: document } = await supabase
    .from("generated_documents")
    .select("id, patient_id, created_at, storage_bucket, storage_path")
    .eq("id", id)
    .eq("patient_id", patient.id)
    .eq("document_type", "nutrition_questionnaire_pdf")
    .maybeSingle();

  if (!document?.storage_bucket || !document.storage_path) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.download",
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

  const download = await supabase.storage
    .from(document.storage_bucket)
    .download(document.storage_path);

  if (download.error || !download.data) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.download",
      actorUserId: user.id,
      entityId: id,
      entityType: "generated_document",
      ip: auditContext.ip,
      metadata: { reason: "storage-download-failed" },
      result: "failed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const createdAt = document.created_at
    ? new Date(document.created_at).toISOString().slice(0, 10)
    : null;
  const filename = createdAt
    ? `chestionar-evaluare-nutritionala-${createdAt}.pdf`
    : `chestionar-evaluare-nutritionala-${document.id}.pdf`;

  await writeSecurityAuditEvent({
    action: "patient.questionnaire.download",
    actorUserId: user.id,
    entityId: document.id,
    entityType: "generated_document",
    ip: auditContext.ip,
    result: "allowed",
    surface: "account",
    userAgent: auditContext.userAgent,
  });

  return new Response(download.data, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": buildContentDisposition(filename),
      "Content-Length": String(download.data.size),
      "Content-Type": download.data.type || "application/pdf",
    },
  });
}
