import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env/server";
import { buildRequestUrl } from "@/lib/http/request-url";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { isUuid } from "@/lib/validation/uuid";
import {
  getPatientQuestionnaireSubmissionDetail,
} from "@/modules/forms/questionnaire";
import {
  renderNutritionQuestionnairePdf,
  type NutritionQuestionnairePdfVariant,
} from "@/modules/pdf/questionnaire-pdf";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentPatientAccount } from "@/modules/patients/account";

type PatientQuestionnaireSubmissionPdfRouteProps = {
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

function normalizePdfVariant(
  value: string | null,
): NutritionQuestionnairePdfVariant {
  return value === "simple" ? "simple" : "styled";
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
  { params }: PatientQuestionnaireSubmissionPdfRouteProps,
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
    return NextResponse.redirect(buildRequestUrl(request, "/cont/autentificare"));
  }

  const { id } = await params;

  if (!isUuid(id)) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.pdf",
      actorUserId: user.id,
      entityId: id,
      entityType: "form_submission",
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
    key: "account:questionnaire:pdf",
    max: 20,
    windowMs: 5 * 60 * 1000,
  });

  const url = new URL(request.url);
  const variant = normalizePdfVariant(url.searchParams.get("variant"));
  const submission = await getPatientQuestionnaireSubmissionDetail({
    patientId: patient.id,
    submissionId: id,
    fallbackToLatest: false,
  });

  if (!submission) {
    await writeSecurityAuditEvent({
      action: "patient.questionnaire.pdf",
      actorUserId: user.id,
      entityId: id,
      entityType: "form_submission",
      ip: auditContext.ip,
      metadata: { reason: "missing-or-unauthorized", variant },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return notFoundResponse();
  }

  const pdfBuffer = await renderNutritionQuestionnairePdf({
    patientName: submission.model.patientName,
    payload: submission.payload,
    reference: submission.documentId ?? submission.id,
    submittedAt: submission.submittedAt,
    variant,
  });

  const dateToken = new Date(submission.submittedAt).toISOString().slice(0, 10);
  const variantToken = variant === "simple" ? "simplu" : "stilizat";
  const filename = `chestionar-evaluare-nutritionala-${variantToken}-${dateToken}.pdf`;

  await writeSecurityAuditEvent({
    action: "patient.questionnaire.pdf",
    actorUserId: user.id,
    entityId: submission.id,
    entityType: "form_submission",
    ip: auditContext.ip,
    metadata: { variant },
    result: "allowed",
    surface: "account",
    userAgent: auditContext.userAgent,
  });

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": buildContentDisposition(filename),
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
