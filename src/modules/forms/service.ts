import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { hasServerEnv } from "@/lib/env/server";
import { getAppointmentResumeFromCookies } from "@/lib/security/appointment-session";
import { encryptJsonPayload } from "@/lib/security/encrypted-payload";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeRecursive } from "@/lib/validation/sanitize";
import { getCurrentSessionUser } from "@/modules/auth/guards";
import {
  getAppointmentForAuthenticatedPatient,
  refreshAppointmentCalendarMetadata,
} from "@/modules/appointments/service";
import { sendAppointmentIntakeCompletedEmail } from "@/modules/email/service";
import {
  getPatientQuestionnaireStatus,
  getPublishedFormVersionId,
  markPatientQuestionnaireCompleted,
  NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
} from "@/modules/forms/questionnaire";
import { QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH } from "@/modules/forms/constants";
import { questionnaireSubmissionSchema } from "@/modules/forms/schemas";
import { renderNutritionQuestionnairePdf } from "@/modules/pdf/questionnaire-pdf";

function appendFormValue(
  container: Record<string, unknown>,
  key: string,
  value: FormDataEntryValue,
) {
  const nextValue = typeof value === "string" ? value : value.name;
  const existing = container[key];

  if (existing === undefined) {
    container[key] = nextValue;
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(nextValue);
    return;
  }

  container[key] = [existing, nextValue];
}

export function formDataToObject(formData: FormData) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    appendFormValue(result, key, value);
  }

  return result;
}

function findOversizedQuestionnaireTextField(
  value: unknown,
  path = "formular",
): string | null {
  if (typeof value === "string") {
    return value.length > QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH ? path : null;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const oversizedPath = findOversizedQuestionnaireTextField(
        entry,
        `${path}[${index + 1}]`,
      );

      if (oversizedPath) {
        return oversizedPath;
      }
    }

    return null;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const oversizedPath = findOversizedQuestionnaireTextField(
        entry,
        path === "formular" ? key : `${path}.${key}`,
      );

      if (oversizedPath) {
        return oversizedPath;
      }
    }
  }

  return null;
}

async function resolveAccessibleAppointment(appointmentId: string) {
  const user = await getCurrentSessionUser();

  if (user?.id) {
    const ownedAppointment = await getAppointmentForAuthenticatedPatient({
      appointmentId,
      authUserId: user.id,
    });

    if (ownedAppointment) {
      return ownedAppointment;
    }
  }

  const resumeSession = await getAppointmentResumeFromCookies();
  if (!resumeSession || resumeSession.appointmentId !== appointmentId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, contact_name, contact_email, contact_email_normalized, intake_status, start_at, public_reference_code_hint, patients(full_name), service_offerings(name)",
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (
    data.contact_email_normalized &&
    data.contact_email_normalized !== resumeSession.email
  ) {
    return null;
  }

  return data;
}

export async function submitNutritionQuestionnaire(formData: FormData) {
  if (!hasServerEnv()) {
    throw new Error("Configureaza Supabase pentru a activa formularele.");
  }

  const supabase = createSupabaseAdminClient();
  const rawPayload = formDataToObject(formData);
  const validatedPayload = questionnaireSubmissionSchema.parse(rawPayload);
  const sanitizedPayload = sanitizeRecursive({
    ...rawPayload,
    ...validatedPayload,
  }) as Record<string, unknown>;
  const oversizedField = findOversizedQuestionnaireTextField(sanitizedPayload);

  if (oversizedField) {
    throw new Error(
      `Campul "${oversizedField}" depaseste limita de ${QUESTIONNAIRE_TEXT_FIELD_MAX_LENGTH} caractere.`,
    );
  }

  const appointmentId = String(sanitizedPayload.event_id ?? "");
  const appointment = await resolveAccessibleAppointment(appointmentId);

  if (!appointment?.id) {
    throw new Error("Programarea asociata nu a fost gasita.");
  }

  if (appointment.intake_status === "submitted") {
    throw new Error("Formularul pentru aceasta programare a fost deja trimis.");
  }

  const currentQuestionnaireVersionId = await getPublishedFormVersionId(
    NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
  );

  if (!currentQuestionnaireVersionId) {
    throw new Error(
      "Versiunea curenta a chestionarului nu este configurata.",
    );
  }

  const patientQuestionnaire = await getPatientQuestionnaireStatus(
    appointment.patient_id,
  );

  if (patientQuestionnaire.state === "completed") {
    throw new Error(
      "Chestionarul Evaluare Nutritionala este deja disponibil in profilul pacientului.",
    );
  }

  const birthDate =
    typeof sanitizedPayload.birth_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(sanitizedPayload.birth_date)
      ? sanitizedPayload.birth_date
      : null;
  const sex =
    typeof sanitizedPayload.sex === "string" && sanitizedPayload.sex.length
      ? sanitizedPayload.sex
      : null;
  const submittedAt = new Date().toISOString();

  await supabase
    .from("patients")
    .update({
      full_name:
        typeof sanitizedPayload.name === "string" && sanitizedPayload.name.length
          ? sanitizedPayload.name
          : undefined,
      normalized_name:
        typeof sanitizedPayload.name === "string" && sanitizedPayload.name.length
          ? sanitizedPayload.name.toLowerCase()
          : undefined,
      birth_date: birthDate,
      sex,
    })
    .eq("id", appointment.patient_id);

  const formInsert = await supabase
    .from("form_submissions")
    .insert({
      definition_id: NUTRITION_QUESTIONNAIRE_DEFINITION_ID,
      version_id: currentQuestionnaireVersionId,
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      status: "submitted",
      payload_json: {},
      payload_encrypted: encryptJsonPayload(sanitizedPayload),
      payload_encrypted_at: submittedAt,
      payload_encryption_key_id: "primary",
      submitted_at: submittedAt,
    })
    .select("id")
    .single();

  if (formInsert.error || !formInsert.data) {
    throw new Error(
      formInsert.error?.message ?? "Nu am putut salva formularul.",
    );
  }

  const generatedDocumentId = randomUUID();
  const referenceHint =
    typeof appointment.public_reference_code_hint === "string" &&
    appointment.public_reference_code_hint.length
      ? appointment.public_reference_code_hint
      : generatedDocumentId;
  const resolvedPatientName =
    typeof sanitizedPayload.name === "string" && sanitizedPayload.name.length
      ? sanitizedPayload.name
      : appointment.patients && typeof appointment.patients === "object"
        ? String((appointment.patients as { full_name?: string }).full_name ?? "Pacient")
        : "Pacient";
  const pdfBuffer = await renderNutritionQuestionnairePdf({
    patientName: resolvedPatientName,
    payload: sanitizedPayload,
    reference: referenceHint,
    submittedAt,
  });

  const checksum = createHash("sha256").update(pdfBuffer).digest("hex");
  const documentPath = `questionnaires/${appointment.id}/${generatedDocumentId}.pdf`;

  const upload = await supabase.storage
    .from("generated-pdfs")
    .upload(documentPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const generatedDocumentInsert = await supabase
    .from("generated_documents")
    .insert({
      id: generatedDocumentId,
      submission_id: formInsert.data.id,
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      document_type: "nutrition_questionnaire_pdf",
      storage_bucket: "generated-pdfs",
      storage_path: documentPath,
      checksum_sha256: checksum,
    })
    .select("id")
    .single();

  if (generatedDocumentInsert.error || !generatedDocumentInsert.data) {
    throw new Error(
      generatedDocumentInsert.error?.message ??
        "Nu am putut salva documentul generat.",
    );
  }

  const intakeSubmittedAt = submittedAt;
  await markPatientQuestionnaireCompleted({
    patientId: appointment.patient_id,
    versionId: currentQuestionnaireVersionId,
    submissionId: formInsert.data.id,
    documentId: generatedDocumentInsert.data.id,
    completedAt: intakeSubmittedAt,
  });

  const appointmentUpdate = await supabase
    .from("appointments")
    .update({
      intake_status: "submitted",
      intake_submitted_at: intakeSubmittedAt,
      intake_submission_id: formInsert.data.id,
      intake_document_id: generatedDocumentInsert.data.id,
    })
    .eq("id", appointment.id);

  if (appointmentUpdate.error) {
    throw new Error(appointmentUpdate.error.message);
  }

  const futureAppointmentsUpdate = await supabase
    .from("appointments")
    .update({
      intake_status: "not_required",
      updated_at: intakeSubmittedAt,
    })
    .select("id")
    .eq("patient_id", appointment.patient_id)
    .neq("id", appointment.id)
    .eq("intake_status", "required_pending")
    .in("status", ["pending", "confirmed"])
    .gt("start_at", intakeSubmittedAt);

  if (futureAppointmentsUpdate.error) {
    throw new Error(futureAppointmentsUpdate.error.message);
  }

  await refreshAppointmentCalendarMetadata({
    appointmentId: appointment.id,
    reason: "intake-submitted",
  });

  for (const relatedAppointment of futureAppointmentsUpdate.data ?? []) {
    await refreshAppointmentCalendarMetadata({
      appointmentId: String(relatedAppointment.id),
      reason: "questionnaire-on-file",
    });
  }

  const serviceName =
    appointment.service_offerings &&
    typeof appointment.service_offerings === "object"
      ? String((appointment.service_offerings as { name?: string }).name ?? "Programare")
      : "Programare";
  const contactName =
    typeof appointment.contact_name === "string" && appointment.contact_name.length
      ? appointment.contact_name
      : appointment.patients && typeof appointment.patients === "object"
        ? String((appointment.patients as { full_name?: string }).full_name ?? "Pacient")
        : "Pacient";
  const contactEmail =
    typeof appointment.contact_email === "string" && appointment.contact_email.length
      ? appointment.contact_email
      : null;

  if (contactEmail) {
    await sendAppointmentIntakeCompletedEmail({
      appointmentId: appointment.id,
      email: contactEmail,
      name: contactName,
      service: serviceName,
      startLabel: new Date(String(appointment.start_at)).toLocaleString("ro-RO"),
    });
  }

  return {
    submissionId: String(formInsert.data.id),
    documentPath,
  };
}
