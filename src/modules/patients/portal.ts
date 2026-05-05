import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPatientQuestionnaireStatus } from "@/modules/forms/questionnaire";
import type {
  AppointmentQuestionnaireStatus,
  AppointmentStatus,
} from "@/modules/appointments/types";
import type {
  PatientPortalAppointment,
  PatientQuestionnaireHistoryItem,
} from "@/modules/patients/portal-shared";
export {
  getPortalAppointmentStatusLabel,
  getPortalQuestionnaireStatusLabel,
} from "@/modules/patients/portal-shared";

type ServiceRelation =
  | {
      name?: string | null;
    }
  | {
      name?: string | null;
    }[]
  | null;

type AppointmentRecord = {
  id: string;
  status: AppointmentStatus;
  intake_status: "not_required" | "required_pending" | "submitted";
  start_at: string;
  end_at: string;
  is_first_visit: boolean;
  sync_status: string;
  public_reference_code_hint: string | null;
  service_offerings: ServiceRelation;
};

function unwrapService(value: ServiceRelation) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveAppointmentQuestionnaireStatus(input: {
  intakeStatus: AppointmentRecord["intake_status"];
  isFirstVisit: boolean;
  patientQuestionnaireState: "missing" | "completed" | "outdated";
}): AppointmentQuestionnaireStatus {
  if (input.intakeStatus === "submitted") {
    return "submitted_for_appointment";
  }

  if (input.patientQuestionnaireState === "completed") {
    return "on_file";
  }

  if (input.isFirstVisit && input.intakeStatus === "required_pending") {
    return "required";
  }

  return "not_required";
}

function mapPatientAppointment(
  appointment: AppointmentRecord,
  patientQuestionnaireState: "missing" | "completed" | "outdated",
) {
  const service = unwrapService(appointment.service_offerings);

  return {
    id: appointment.id,
    status: appointment.status,
    intakeStatus: appointment.intake_status,
    startAt: appointment.start_at,
    endAt: appointment.end_at,
    isFirstVisit: appointment.is_first_visit,
    syncStatus: appointment.sync_status,
    referenceHint: appointment.public_reference_code_hint,
    serviceName: service?.name ?? "Consultatie",
    questionnaireStatus: resolveAppointmentQuestionnaireStatus({
      intakeStatus: appointment.intake_status,
      isFirstVisit: appointment.is_first_visit,
      patientQuestionnaireState,
    }),
  } satisfies PatientPortalAppointment;
}

export async function listPatientPortalAppointments(input: {
  patientId: string;
  limit?: number;
}) {
  const supabase = createSupabaseAdminClient();
  const [questionnaireStatus, appointmentsResult] = await Promise.all([
    getPatientQuestionnaireStatus(input.patientId),
    supabase
      .from("appointments")
      .select(
        "id, status, intake_status, start_at, end_at, is_first_visit, sync_status, public_reference_code_hint, service_offerings(name)",
      )
      .eq("patient_id", input.patientId)
      .order("start_at", { ascending: false })
      .limit(input.limit ?? 20),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  return (appointmentsResult.data ?? []).map((appointment) =>
    mapPatientAppointment(
      appointment as AppointmentRecord,
      questionnaireStatus.state,
    ),
  );
}

export async function getUpcomingPatientPortalAppointment(patientId: string) {
  const supabase = createSupabaseAdminClient();
  const [questionnaireStatus, appointmentResult] = await Promise.all([
    getPatientQuestionnaireStatus(patientId),
    supabase
      .from("appointments")
      .select(
        "id, status, intake_status, start_at, end_at, is_first_visit, sync_status, public_reference_code_hint, service_offerings(name)",
      )
      .eq("patient_id", patientId)
      .in("status", ["pending", "confirmed"])
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (appointmentResult.error) {
    throw new Error(appointmentResult.error.message);
  }

  if (!appointmentResult.data) {
    return null;
  }

  return mapPatientAppointment(
    appointmentResult.data as AppointmentRecord,
    questionnaireStatus.state,
  );
}

export async function listPatientQuestionnaireHistory(
  patientId: string,
  limit = 5,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("id, version_id, submitted_at")
    .eq("patient_id", patientId)
    .eq("definition_id", "nutrition-intake")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    versionId: String(item.version_id),
    submittedAt: String(item.submitted_at),
  })) satisfies PatientQuestionnaireHistoryItem[];
}
