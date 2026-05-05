export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type AppointmentSyncStatus =
  | "pending"
  | "synced"
  | "needs_retry"
  | "failed";

export type AppointmentIntakeStatus =
  | "not_required"
  | "required_pending"
  | "submitted";

export type AppointmentQuestionnaireStatus =
  | "required"
  | "on_file"
  | "submitted_for_appointment"
  | "not_required";

export type AppointmentSource = "public_site" | "patient_account" | "admin_panel";

export type PublicAppointmentInput = {
  name: string;
  email: string;
  phone: string;
  serviceSlug: string;
  date: string;
  time: string;
  isFirstVisit: boolean;
  source?: AppointmentSource;
  patientId?: string | null;
  authUserId?: string | null;
};

export type AdminAppointmentInput = {
  patientId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  serviceSlug: string;
  date: string;
  time: string;
  isFirstVisit: boolean;
  adminUserId: string;
};
