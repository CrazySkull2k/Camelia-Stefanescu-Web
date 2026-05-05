import "server-only";

import { hasSupabaseEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  defaultAppointmentSchedule,
  normalizeClinicSchedule,
  type ClinicAppointmentSchedule,
} from "@/modules/settings/schedule";

export type ClinicSettings = {
  appointmentSchedule: ClinicAppointmentSchedule;
  requireManualAppointmentConfirmation: boolean;
};

const defaultSettings: ClinicSettings = {
  appointmentSchedule: defaultAppointmentSchedule,
  requireManualAppointmentConfirmation: false,
};

export async function getClinicSettings() {
  if (!hasSupabaseEnv()) {
    return defaultSettings;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("require_manual_appointment_confirmation, appointment_schedule")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultSettings;
  }

  return {
    appointmentSchedule: normalizeClinicSchedule(data.appointment_schedule),
    requireManualAppointmentConfirmation: Boolean(
      data.require_manual_appointment_confirmation,
    ),
  };
}

export async function updateClinicSettings(input: ClinicSettings) {
  if (!hasSupabaseEnv()) {
    throw new Error("Configureaza Supabase pentru a salva setarile.");
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("clinic_settings").upsert(
    {
      singleton: true,
      appointment_schedule: input.appointmentSchedule,
      require_manual_appointment_confirmation:
        input.requireManualAppointmentConfirmation,
      updated_at: now,
    },
    {
      onConflict: "singleton",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return input;
}
