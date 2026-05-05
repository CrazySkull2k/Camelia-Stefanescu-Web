import "server-only";

import type { User } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { getCurrentSessionUser } from "@/modules/auth/guards";

export type PatientAccount = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  sex: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function getFallbackName(user: User) {
  const metadataName = sanitizePlainText(
    String(user.user_metadata.full_name ?? user.user_metadata.name ?? ""),
  );

  if (metadataName) {
    return metadataName;
  }

  if (user.email) {
    const localPart = user.email.split("@")[0] ?? "Pacient";
    return sanitizePlainText(localPart.replace(/[._-]+/g, " ")) || "Pacient";
  }

  return "Pacient";
}

async function getLinkedPatientByUserId(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("patients")
    .select("id, auth_user_id, full_name, email, phone, birth_date, sex")
    .eq("auth_user_id", userId)
    .maybeSingle();

  return (data as PatientAccount | null) ?? null;
}

export async function ensurePatientAccountForUser(user: User) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const existingLinked = await getLinkedPatientByUserId(user.id);
  if (existingLinked) {
    return existingLinked;
  }

  if (!user.email || !user.email_confirmed_at) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(user.email);
  const fallbackName = getFallbackName(user);

  const { data: matchedPatients } = await supabase
    .from("patients")
    .select("id, auth_user_id, full_name, email, phone, birth_date, sex, created_at")
    .eq("normalized_email", normalizedEmail)
    .is("auth_user_id", null)
    .order("created_at", { ascending: false })
    .limit(2);

  if ((matchedPatients?.length ?? 0) === 1) {
    const matched = matchedPatients?.[0];
    const { data: linked } = await supabase
      .from("patients")
      .update({
        auth_user_id: user.id,
        email: normalizedEmail,
        normalized_email: normalizedEmail,
        full_name: matched?.full_name?.trim() || fallbackName,
        normalized_name:
          matched?.full_name?.trim().toLowerCase() || fallbackName.toLowerCase(),
      })
      .eq("id", matched!.id)
      .select("id, auth_user_id, full_name, email, phone, birth_date, sex")
      .single();

    return (linked as PatientAccount | null) ?? null;
  }

  const { data: created } = await supabase
    .from("patients")
    .insert({
      auth_user_id: user.id,
      full_name: fallbackName,
      normalized_name: fallbackName.toLowerCase(),
      email: normalizedEmail,
      normalized_email: normalizedEmail,
    })
    .select("id, auth_user_id, full_name, email, phone, birth_date, sex")
    .single();

  return (created as PatientAccount | null) ?? null;
}

export async function getCurrentPatientAccount() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return {
      user: null,
      patient: null,
    };
  }

  return {
    user,
    patient: await ensurePatientAccountForUser(user),
  };
}

export async function updateCurrentPatientProfile(input: {
  fullName: string;
  phone?: string;
  birthDate?: string;
  sex?: string;
}) {
  const user = await getCurrentSessionUser();

  if (!user || !user.email || !user.email_confirmed_at) {
    throw new Error("Autentificarea pacientului este necesara.");
  }

  const patient = await ensurePatientAccountForUser(user);

  if (!patient?.id) {
    throw new Error("Nu am putut identifica profilul pacientului.");
  }

  const fullName = sanitizePlainText(input.fullName).trim();
  if (!fullName) {
    throw new Error("Numele complet este obligatoriu.");
  }

  const phone = sanitizePlainText(input.phone ?? "").trim();
  const birthDate =
    input.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)
      ? input.birthDate
      : null;
  const sex = input.sex === "M" || input.sex === "F" ? input.sex : null;
  const now = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  const profileUpdate = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: now,
    })
    .eq("id", user.id);

  if (profileUpdate.error) {
    throw new Error(profileUpdate.error.message);
  }

  const patientUpdate = await supabase
    .from("patients")
    .update({
      full_name: fullName,
      normalized_name: fullName.toLowerCase(),
      email: normalizeEmail(user.email),
      normalized_email: normalizeEmail(user.email),
      phone: phone || null,
      normalized_phone: phone ? normalizePhone(phone) : null,
      birth_date: birthDate,
      sex,
      updated_at: now,
    })
    .eq("auth_user_id", user.id)
    .select("id, auth_user_id, full_name, email, phone, birth_date, sex")
    .single();

  if (patientUpdate.error || !patientUpdate.data) {
    throw new Error(
      patientUpdate.error?.message ?? "Nu am putut actualiza profilul pacientului.",
    );
  }

  return patientUpdate.data as PatientAccount;
}
