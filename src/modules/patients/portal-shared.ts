import type {
  AppointmentQuestionnaireStatus,
  AppointmentStatus,
} from "@/modules/appointments/types";

export type PatientPortalAppointment = {
  id: string;
  status: AppointmentStatus;
  intakeStatus: "not_required" | "required_pending" | "submitted";
  startAt: string;
  endAt: string;
  isFirstVisit: boolean;
  syncStatus: string;
  referenceHint: string | null;
  serviceName: string;
  questionnaireStatus: AppointmentQuestionnaireStatus;
};

export type PatientQuestionnaireHistoryItem = {
  id: string;
  versionId: string;
  submittedAt: string;
};

export function getPortalAppointmentStatusLabel(status: AppointmentStatus) {
  if (status === "confirmed") {
    return "Confirmata";
  }

  if (status === "cancelled") {
    return "Anulata";
  }

  if (status === "completed") {
    return "Finalizata";
  }

  return "In curs de procesare";
}

export function getPortalQuestionnaireStatusLabel(
  status: AppointmentQuestionnaireStatus,
) {
  if (status === "submitted_for_appointment") {
    return "Trimis pentru aceasta programare";
  }

  if (status === "on_file") {
    return "Disponibil in profil";
  }

  if (status === "required") {
    return "Necesita completare";
  }

  return "Nu este necesar";
}
