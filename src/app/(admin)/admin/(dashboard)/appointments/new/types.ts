import type {
  AppointmentStatus,
  AppointmentSyncStatus,
} from "@/modules/appointments/types";

export type AdminAppointmentPatientOption = {
  email: string | null;
  fullName: string;
  hasAccount: boolean;
  id: string;
  latestAppointmentLabel: string | null;
  phone: string | null;
  statusLabel: string;
};

export type AdminAppointmentResult = {
  appointmentId: string;
  endAt: string;
  patientEmail: string;
  patientName: string;
  requiresIntake: boolean;
  serviceName: string;
  startAt: string;
  status: AppointmentStatus;
  syncStatus: AppointmentSyncStatus;
};

export type AdminAppointmentApiResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };
