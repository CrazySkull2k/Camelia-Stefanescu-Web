import "server-only";

import { resolveStoredQuestionnairePayload } from "@/lib/security/encrypted-payload";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildNutritionQuestionnairePdfModel,
  type NutritionQuestionnairePdfModel,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";

export const NUTRITION_QUESTIONNAIRE_DEFINITION_ID = "nutrition-intake";

export type PatientQuestionnaireState = "missing" | "completed" | "outdated";

export type PatientQuestionnaireStatus = {
  patientId: string;
  definitionId: string;
  currentVersionId: string | null;
  completedVersionId: string | null;
  latestSubmissionId: string | null;
  latestDocumentId: string | null;
  latestDocumentBucket: string | null;
  latestDocumentPath: string | null;
  completedAt: string | null;
  state: PatientQuestionnaireState;
};

type PatientFormStatusRecord = {
  patient_id: string;
  definition_id: string;
  completed_version_id: string | null;
  latest_submission_id: string | null;
  latest_document_id: string | null;
  completed_at: string | null;
};

type GeneratedDocumentRecord = {
  id: string;
  storage_bucket: string;
  storage_path: string;
};

type QuestionnaireSubmissionRecord = {
  id: string;
  version_id: string;
  submitted_at: string;
  status: string;
  payload_json: unknown;
  payload_encrypted: unknown;
  generated_documents:
    | GeneratedDocumentRecord
    | GeneratedDocumentRecord[]
    | null;
  patients:
    | {
        full_name?: string | null;
      }
    | {
        full_name?: string | null;
      }[]
    | null;
};

export type PatientQuestionnaireSubmissionDetail = {
  documentId: string | null;
  documentPath: string | null;
  documentBucket: string | null;
  id: string;
  model: NutritionQuestionnairePdfModel;
  payload: Record<string, unknown>;
  status: string;
  submittedAt: string;
  versionId: string;
};

function unwrapGeneratedDocument(
  value: QuestionnaireSubmissionRecord["generated_documents"],
) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function unwrapPatient(
  value: QuestionnaireSubmissionRecord["patients"],
) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getPublishedFormVersionId(definitionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("form_versions")
    .select("id")
    .eq("definition_id", definitionId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function getPatientFormStatusRecord(input: {
  patientId: string;
  definitionId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("patient_form_statuses")
    .select(
      "patient_id, definition_id, completed_version_id, latest_submission_id, latest_document_id, completed_at",
    )
    .eq("patient_id", input.patientId)
    .eq("definition_id", input.definitionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PatientFormStatusRecord | null) ?? null;
}

async function getGeneratedDocumentRecord(documentId: string | null) {
  if (!documentId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, storage_bucket, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as GeneratedDocumentRecord | null) ?? null;
}

export async function getPatientQuestionnaireStatus(patientId: string) {
  const [currentVersionId, statusRecord] = await Promise.all([
    getPublishedFormVersionId(NUTRITION_QUESTIONNAIRE_DEFINITION_ID),
    getPatientFormStatusRecord({
      patientId,
      definitionId: NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
    }),
  ]);
  const latestDocument = await getGeneratedDocumentRecord(
    statusRecord?.latest_document_id ?? null,
  );

  let state: PatientQuestionnaireState = "missing";
  if (statusRecord?.completed_version_id && currentVersionId) {
    state =
      statusRecord.completed_version_id === currentVersionId
        ? "completed"
        : "outdated";
  }

  return {
    patientId,
    definitionId: NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
    currentVersionId,
    completedVersionId: statusRecord?.completed_version_id ?? null,
    latestSubmissionId: statusRecord?.latest_submission_id ?? null,
    latestDocumentId: statusRecord?.latest_document_id ?? null,
    latestDocumentBucket: latestDocument?.storage_bucket ?? null,
    latestDocumentPath: latestDocument?.storage_path ?? null,
    completedAt: statusRecord?.completed_at ?? null,
    state,
  } satisfies PatientQuestionnaireStatus;
}

export async function getPatientQuestionnaireSubmissionDetail(input: {
  patientId: string;
  submissionId?: string | null;
  fallbackToLatest?: boolean;
}) {
  const supabase = createSupabaseAdminClient();

  async function fetchSubmissionById(submissionId: string) {
    const result = await supabase
      .from("form_submissions")
      .select(
        "id, version_id, submitted_at, status, payload_json, payload_encrypted, generated_documents(id, storage_bucket, storage_path), patients(full_name)",
      )
      .eq("patient_id", input.patientId)
      .eq("definition_id", NUTRITION_QUESTIONNAIRE_DEFINITION_ID)
      .eq("id", submissionId)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data as QuestionnaireSubmissionRecord | null) ?? null;
  }

  async function fetchLatestSubmission() {
    const result = await supabase
      .from("form_submissions")
      .select(
        "id, version_id, submitted_at, status, payload_json, payload_encrypted, generated_documents(id, storage_bucket, storage_path), patients(full_name)",
      )
      .eq("patient_id", input.patientId)
      .eq("definition_id", NUTRITION_QUESTIONNAIRE_DEFINITION_ID)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data as QuestionnaireSubmissionRecord | null) ?? null;
  }

  const submission =
    (input.submissionId
      ? await fetchSubmissionById(input.submissionId)
      : null) ??
    (input.fallbackToLatest === false ? null : await fetchLatestSubmission());

  if (!submission) {
    return null;
  }

  const resolvedPayload = resolveStoredQuestionnairePayload({
    payloadEncrypted: submission.payload_encrypted,
    payloadJson: submission.payload_json,
  });
  const payload =
    resolvedPayload && typeof resolvedPayload === "object" && !Array.isArray(resolvedPayload)
      ? (resolvedPayload as Record<string, unknown>)
      : {};
  const document = unwrapGeneratedDocument(submission.generated_documents);
  const patient = unwrapPatient(submission.patients);

  return {
    documentBucket: document?.storage_bucket ?? null,
    documentId: document?.id ?? null,
    documentPath: document?.storage_path ?? null,
    id: submission.id,
    model: buildNutritionQuestionnairePdfModel({
      patientName: patient?.full_name?.trim() || "Pacient",
      payload,
      reference: document?.id ?? submission.id,
      submittedAt: submission.submitted_at,
    }),
    payload,
    status: submission.status,
    submittedAt: submission.submitted_at,
    versionId: submission.version_id,
  } satisfies PatientQuestionnaireSubmissionDetail;
}

export async function markPatientQuestionnaireCompleted(input: {
  patientId: string;
  versionId: string;
  submissionId: string;
  documentId: string;
  completedAt: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("patient_form_statuses").upsert(
    {
      patient_id: input.patientId,
      definition_id: NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
      completed_version_id: input.versionId,
      latest_submission_id: input.submissionId,
      latest_document_id: input.documentId,
      completed_at: input.completedAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "patient_id,definition_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
