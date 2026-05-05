import "server-only";

import { z } from "zod";

import { normalizeEmailForLookup } from "@/lib/security/appointment-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { createAdminAppointment } from "@/modules/appointments/service";
import type {
  AdminAppointmentApiResult,
  AdminAppointmentPatientOption,
  AdminAppointmentResult,
} from "@/app/(admin)/admin/(dashboard)/appointments/new/types";
import type { AppointmentStatus } from "@/modules/appointments/types";

type PatientRecord = {
  auth_user_id: string | null;
  created_at: string;
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
  updated_at: string | null;
};

type AppointmentRecord = {
  end_at: string;
  patient_id: string;
  service_offerings:
    | {
        name?: string | null;
      }
    | {
        name?: string | null;
      }[]
    | null;
  start_at: string;
  status: AppointmentStatus;
};

export const patientSearchSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) =>
    value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim(),
  );

export const createPatientSchema = z.object({
  email: z.string().trim().email("Email invalid.").max(160),
  fullName: z.string().trim().min(2, "Numele este obligatoriu.").max(120),
  phone: z.string().trim().min(7, "Telefonul este obligatoriu.").max(30),
});

export const createAppointmentSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().trim().email().max(160),
  isFirstVisit: z.boolean(),
  patientId: z.string().uuid(),
  phone: z.string().trim().min(7).max(30),
  serviceSlug: z.string().trim().min(1).max(180),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/),
});

const appointmentDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function unwrapRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatLatestAppointment(appointment?: AppointmentRecord | null) {
  if (!appointment) {
    return null;
  }

  const date = new Date(appointment.start_at);
  const service = unwrapRelation(appointment.service_offerings);

  if (Number.isNaN(date.getTime())) {
    return service?.name ?? "Programare";
  }

  return `${service?.name ?? "Programare"} - ${appointmentDateFormatter
    .format(date)
    .replace(".", "")}`;
}

function statusLabel(appointment?: AppointmentRecord | null) {
  if (!appointment) {
    return "Fara programari";
  }

  if (appointment.status === "confirmed") return "Activ";
  if (appointment.status === "pending") return "In asteptare";
  if (appointment.status === "completed") return "Finalizat";
  if (appointment.status === "cancelled") return "Anulat";
  return "Activ";
}

function toPatientOption(
  patient: PatientRecord,
  latestAppointment?: AppointmentRecord | null,
): AdminAppointmentPatientOption {
  return {
    email: patient.email,
    fullName: patient.full_name,
    hasAccount: Boolean(patient.auth_user_id),
    id: patient.id,
    latestAppointmentLabel: formatLatestAppointment(latestAppointment),
    phone: patient.phone,
    statusLabel: statusLabel(latestAppointment),
  };
}

function appointmentByPatient(records: AppointmentRecord[]) {
  const map = new Map<string, AppointmentRecord>();

  records.forEach((appointment) => {
    if (!map.has(appointment.patient_id)) {
      map.set(appointment.patient_id, appointment);
    }
  });

  return map;
}

export async function searchAdminAppointmentPatientsForWizard(
  rawQuery: string,
): Promise<AdminAppointmentApiResult<AdminAppointmentPatientOption[]>> {
  const parsedQuery = patientSearchSchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    return { error: "Cautarea este invalida.", ok: false };
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("patients")
    .select("id, full_name, email, phone, auth_user_id, created_at, updated_at")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (parsedQuery.data) {
    const pattern = `%${parsedQuery.data}%`;
    query = query.or(
      [`full_name.ilike.${pattern}`, `email.ilike.${pattern}`, `phone.ilike.${pattern}`].join(
        ",",
      ),
    );
  }

  const patientsResult = await query;
  if (patientsResult.error) {
    return { error: "Nu am putut incarca lista de pacienti.", ok: false };
  }

  const patients = (patientsResult.data ?? []) as PatientRecord[];
  const patientIds = patients.map((patient) => patient.id);
  const appointmentsResult = patientIds.length
    ? await supabase
        .from("appointments")
        .select("patient_id, status, start_at, end_at, service_offerings(name)")
        .in("patient_id", patientIds)
        .order("start_at", { ascending: false })
    : { data: [] as AppointmentRecord[], error: null };

  if (appointmentsResult.error) {
    return { error: "Nu am putut incarca istoricul pacientilor.", ok: false };
  }

  const latestAppointments = appointmentByPatient(
    (appointmentsResult.data ?? []) as AppointmentRecord[],
  );

  return {
    data: patients.map((patient) =>
      toPatientOption(patient, latestAppointments.get(patient.id) ?? null),
    ),
    ok: true,
  };
}

export async function createAdminPatientForAppointmentWizard(
  input: unknown,
): Promise<AdminAppointmentApiResult<AdminAppointmentPatientOption>> {
  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datele pacientului sunt invalide.",
      ok: false,
    };
  }

  const fullName = sanitizePlainText(parsed.data.fullName);
  const email = normalizeEmailForLookup(parsed.data.email);
  const phone = sanitizePlainText(parsed.data.phone);
  const normalizedPhone = normalizePhone(phone);
  const supabase = createSupabaseAdminClient();

  const existingResult = await supabase
    .from("patients")
    .select("id")
    .or(`normalized_email.eq.${email},normalized_phone.eq.${normalizedPhone}`)
    .limit(1);

  if (existingResult.error) {
    return { error: "Nu am putut verifica pacientii existenti.", ok: false };
  }

  if (existingResult.data?.length) {
    return {
      error: "Exista deja un pacient cu acest email sau telefon. Alege-l din cautare.",
      ok: false,
    };
  }

  const insertResult = await supabase
    .from("patients")
    .insert({
      auth_user_id: null,
      email,
      full_name: fullName,
      normalized_email: email,
      normalized_name: fullName.toLowerCase(),
      normalized_phone: normalizedPhone,
      phone,
      updated_at: new Date().toISOString(),
    })
    .select("id, full_name, email, phone, auth_user_id, created_at, updated_at")
    .single();

  if (insertResult.error || !insertResult.data) {
    return {
      error: "Nu am putut crea pacientul.",
      ok: false,
    };
  }

  return {
    data: toPatientOption(insertResult.data as PatientRecord, null),
    ok: true,
  };
}

export async function createAdminAppointmentFromWizardMutation({
  adminUserId,
  input,
}: {
  adminUserId: string;
  input: unknown;
}): Promise<AdminAppointmentApiResult<AdminAppointmentResult>> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datele programarii sunt invalide.",
      ok: false,
    };
  }

  try {
    const result = await createAdminAppointment({
      adminUserId,
      date: parsed.data.date,
      email: parsed.data.email,
      isFirstVisit: parsed.data.isFirstVisit,
      patientId: parsed.data.patientId,
      phone: parsed.data.phone,
      serviceSlug: parsed.data.serviceSlug,
      time: parsed.data.time,
    });

    return {
      data: {
        appointmentId: result.appointmentId,
        endAt: result.endAt,
        patientEmail: result.patientEmail,
        patientName: result.patientName,
        requiresIntake: result.requiresIntake,
        serviceName: result.serviceName,
        startAt: result.startAt,
        status: result.status,
        syncStatus: result.syncStatus,
      },
      ok: true,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nu am putut crea programarea.",
      ok: false,
    };
  }
}
