import "server-only";

import {
  addMinutes,
  differenceInMinutes,
  formatISO,
} from "date-fns";

import {
  hasGoogleCalendarEnv,
  hasSupabaseEnv,
} from "@/lib/env/server";
import { getPublicSiteUrl } from "@/lib/env/client";
import {
  createPublicReferenceCode,
  getPublicReferenceCodeHint,
  hashPublicReferenceCode,
  normalizeBookingReferenceCode,
  normalizeEmailForLookup,
} from "@/lib/security/appointment-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromBucharestDateTime, getBucharestDayBounds } from "@/lib/utils/dates";
import { log } from "@/lib/utils/logger";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { writeAuditLog } from "@/modules/audit/service";
import {
  createOrUpdateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleCalendarBusyRanges,
  hasGoogleCalendarConflict,
} from "@/modules/calendar/service";
import { listAvailabilityBlockingRanges } from "@/modules/calendar-blocks/service";
import { listExternalCalendarBlockingRanges } from "@/modules/external-calendar-events/service";
import {
  sendAppointmentEmails,
  sendAppointmentStatusUpdateEmail,
} from "@/modules/email/service";
import {
  ensureServiceOfferingPersisted,
  getServiceOfferings,
} from "@/modules/pricing/service";
import { getPatientQuestionnaireStatus } from "@/modules/forms/questionnaire";
import { getClinicSettings } from "@/modules/settings/service";
import {
  buildHalfHourTimeOptions,
  getBucharestDateValue,
  getBucharestTimeMinutes,
  getWorkingWindowForDate,
} from "@/modules/settings/schedule";
import type {
  AdminAppointmentInput,
  AppointmentIntakeStatus,
  AppointmentQuestionnaireStatus,
  AppointmentStatus,
  AppointmentSyncStatus,
  PublicAppointmentInput,
} from "@/modules/appointments/types";

const APPOINTMENT_SELECT =
  "id, patient_id, resource_id, service_offering_id, status, sync_status, timezone, is_first_visit, start_at, end_at, patient_notes, admin_notes, requested_at, confirmed_at, cancelled_at, completed_at, google_calendar_id, google_event_id, last_synced_at, sync_error, contact_name, contact_email, contact_email_normalized, contact_phone, public_reference_code_hint, intake_status, intake_submitted_at, intake_submission_id, intake_document_id, patients(full_name, email, phone), service_offerings(id, name, duration_minutes)";

type AppointmentRecord = {
  id: string;
  patient_id: string;
  resource_id: string;
  service_offering_id: string | null;
  status: AppointmentStatus;
  sync_status: AppointmentSyncStatus;
  timezone: string;
  is_first_visit: boolean;
  start_at: string;
  end_at: string;
  patient_notes: string | null;
  admin_notes: string | null;
  requested_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  google_calendar_id: string | null;
  google_event_id: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_email_normalized: string | null;
  contact_phone: string | null;
  public_reference_code_hint: string | null;
  intake_status: AppointmentIntakeStatus;
  intake_submitted_at: string | null;
  intake_submission_id: string | null;
  intake_document_id: string | null;
  patients:
    | {
        full_name?: string | null;
        email?: string | null;
        phone?: string | null;
      }[]
    | {
        full_name?: string | null;
        email?: string | null;
        phone?: string | null;
      }
    | null;
  service_offerings:
    | {
        id?: string | null;
        name?: string | null;
        duration_minutes?: number | null;
      }[]
    | {
        id?: string | null;
        name?: string | null;
        duration_minutes?: number | null;
      }
    | null;
};

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function normalizeEmail(email: string) {
  return normalizeEmailForLookup(email);
}

function findServiceOfferingByIdentifier(
  offerings: Awaited<ReturnType<typeof getServiceOfferings>>,
  identifier?: string | null,
) {
  if (!identifier) {
    return null;
  }

  return (
    offerings.find((offering) => offering.slug === identifier) ??
    offerings.find((offering) => offering.title === identifier) ??
    null
  );
}

function toDateTime(date: string, time: string) {
  return fromBucharestDateTime(date, time);
}

function unwrapRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildAppointmentDescription(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isFirstVisit: boolean;
  status: AppointmentStatus;
  publicReferenceHint?: string | null;
  questionnaireStatus: AppointmentQuestionnaireStatus;
  appointmentId: string;
}) {
  const intakeCopy =
    input.questionnaireStatus === "submitted_for_appointment"
      ? "Completat pentru aceasta programare"
      : input.questionnaireStatus === "on_file"
        ? "Disponibil in profil"
        : input.questionnaireStatus === "required"
          ? "Necesar"
          : "Nu este necesar";
  const adminDocumentUrl =
    input.questionnaireStatus === "submitted_for_appointment"
      ? `${getPublicSiteUrl()}/admin/appointments/${input.appointmentId}/document`
      : null;

  return [
    `Status: ${input.status}`,
    input.phone ? `Telefon: ${input.phone}` : null,
    input.email ? `Email: ${input.email}` : null,
    `Prima vizita: ${input.isFirstVisit ? "Da" : "Nu"}`,
    input.publicReferenceHint
      ? `Cod verificare: ${input.publicReferenceHint}`
      : null,
    `Intake: ${intakeCopy}`,
    adminDocumentUrl ? `Document intake: ${adminDocumentUrl}` : null,
    input.notes ? `Note: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function resolveAppointmentQuestionnaireStatus(
  appointment: AppointmentRecord,
): Promise<AppointmentQuestionnaireStatus> {
  if (appointment.intake_status === "submitted") {
    return "submitted_for_appointment";
  }

  const patientQuestionnaire = await getPatientQuestionnaireStatus(
    appointment.patient_id,
  );

  if (patientQuestionnaire.state === "completed") {
    return "on_file";
  }

  if (appointment.is_first_visit && appointment.intake_status === "required_pending") {
    return "required";
  }

  return "not_required";
}

async function getAppointmentLookupRecord(input: {
  normalizedEmail: string;
  codeHash: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("contact_email_normalized", input.normalizedEmail)
    .eq("public_reference_code_hash", input.codeHash)
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AppointmentRecord | null) ?? null;
}

function appointmentStatusCopy(status: AppointmentStatus) {
  if (status === "confirmed") {
    return "Confirmata";
  }

  if (status === "cancelled") {
    return "Anulata";
  }

  if (status === "completed") {
    return "Finalizata";
  }

  return "Cerere primita";
}

async function assertSlotAvailable(input: {
  startAt: Date;
  endAt: Date;
  resourceId: string;
  excludeAppointmentId?: string;
  excludeGoogleEventId?: string | null;
}) {
  const clinicSettings = await getClinicSettings();
  const startDateKey = getBucharestDateValue(input.startAt);
  const endDateKey = getBucharestDateValue(input.endAt);
  const workingWindow = getWorkingWindowForDate(
    startDateKey,
    clinicSettings.appointmentSchedule,
  );
  const startMinutes = getBucharestTimeMinutes(input.startAt);
  const endMinutes = getBucharestTimeMinutes(input.endAt);

  if (
    !workingWindow ||
    startDateKey !== endDateKey ||
    startMinutes === null ||
    endMinutes === null ||
    startMinutes < workingWindow.startMinutes ||
    endMinutes > workingWindow.endMinutes
  ) {
    throw new Error("Intervalul selectat este in afara programului cabinetului.");
  }

  const supabase = createSupabaseAdminClient();
  const startIso = formatISO(input.startAt);
  const endIso = formatISO(input.endAt);
  let query = supabase
    .from("appointments")
    .select("id", { head: false })
    .eq("resource_id", input.resourceId)
    .lt("start_at", endIso)
    .gt("end_at", startIso)
    .in("status", ["pending", "confirmed", "completed"]);

  if (input.excludeAppointmentId) {
    query = query.neq("id", input.excludeAppointmentId);
  }

  const { data: overlaps, error } = await query.limit(1);
  if (error) {
    throw new Error(error.message);
  }

  if (overlaps?.length) {
    throw new Error("Intervalul selectat nu mai este disponibil.");
  }

  const [calendarBlocks, externalCalendarEvents] = await Promise.all([
    listAvailabilityBlockingRanges({
      from: input.startAt,
      to: input.endAt,
    }),
    listExternalCalendarBlockingRanges({
      from: input.startAt,
      to: input.endAt,
    }),
  ]);
  const blockingRanges = [...calendarBlocks, ...externalCalendarEvents];
  const hasCustomBlockConflict = blockingRanges.some(
    (range) => input.startAt < range.end && input.endAt > range.start,
  );

  if (hasCustomBlockConflict) {
    throw new Error("Intervalul selectat este blocat in programul cabinetului.");
  }

  const hasGoogleConflict = await hasGoogleCalendarConflict({
    startAt: startIso,
    endAt: endIso,
    excludeEventId: input.excludeGoogleEventId ?? undefined,
  });

  if (hasGoogleConflict) {
    throw new Error(
      "Intervalul selectat este deja ocupat in calendarul cabinetului.",
    );
  }
}

async function queueAppointmentSyncJob(input: {
  appointmentId: string;
  action: "create" | "update" | "delete";
  errorMessage: string;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("appointment_sync_jobs").insert({
    appointment_id: input.appointmentId,
    action: input.action,
    status: "pending",
    attempt_count: 1,
    last_error: input.errorMessage,
    scheduled_at: new Date().toISOString(),
  });
}

async function syncAppointmentCalendar(
  appointment: AppointmentRecord,
  action: "create" | "update" | "delete",
) {
  const supabase = createSupabaseAdminClient();
  const patient = unwrapRelation(appointment.patients);
  const service = unwrapRelation(appointment.service_offerings);
  const contactName = appointment.contact_name ?? patient?.full_name ?? "Pacient";
  const contactEmail = appointment.contact_email ?? patient?.email ?? null;
  const contactPhone = appointment.contact_phone ?? patient?.phone ?? null;
  const questionnaireStatus = await resolveAppointmentQuestionnaireStatus(
    appointment,
  );

  try {
    if (appointment.status === "cancelled" || action === "delete") {
      if (appointment.google_event_id) {
        await deleteGoogleCalendarEvent(appointment.google_event_id);
      }

      await supabase
        .from("appointments")
        .update({
          google_calendar_id: process.env.GOOGLE_CALENDAR_ID ?? null,
          google_event_id: null,
          sync_status: "synced",
          sync_error: null,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      return {
        syncStatus: "synced" as const,
        googleEventId: null,
      };
    }

    const event = await createOrUpdateGoogleCalendarEvent({
      eventId: appointment.google_event_id,
      summary: `${contactName} - ${service?.name ?? "Programare"}`,
      description: buildAppointmentDescription({
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        notes: appointment.admin_notes ?? appointment.patient_notes,
        isFirstVisit: appointment.is_first_visit,
        status: appointment.status,
        publicReferenceHint: appointment.public_reference_code_hint,
        questionnaireStatus,
        appointmentId: appointment.id,
      }),
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      status: appointment.status,
    });

    await supabase
      .from("appointments")
      .update({
        google_calendar_id: process.env.GOOGLE_CALENDAR_ID ?? null,
        google_event_id: event.id ?? appointment.google_event_id ?? null,
        sync_status: "synced",
        sync_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    await supabase
      .from("appointment_sync_jobs")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("appointment_id", appointment.id)
      .eq("status", "pending");

    return {
      syncStatus: "synced" as const,
      googleEventId: event.id ?? appointment.google_event_id ?? null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Calendar sync failed.";

    await supabase
      .from("appointments")
      .update({
        google_calendar_id: process.env.GOOGLE_CALENDAR_ID ?? null,
        sync_status: "needs_retry",
        sync_error: message,
      })
      .eq("id", appointment.id);

    await queueAppointmentSyncJob({
      appointmentId: appointment.id,
      action,
      errorMessage: message,
    });

    return {
      syncStatus: "needs_retry" as const,
      googleEventId: appointment.google_event_id,
      syncError: message,
    };
  }
}

async function getAppointmentRecord(appointmentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Programarea nu a fost gasita.");
  }

  return data as AppointmentRecord;
}

export async function listAvailableSlots(date: string, serviceIdentifier?: string) {
  const offerings = await getServiceOfferings();
  const selectedOffering = findServiceOfferingByIdentifier(
    offerings,
    serviceIdentifier,
  );
  const durationMinutes = selectedOffering?.durationMinutes ?? 60;
  const clinicSettings = await getClinicSettings();
  const workingWindow = getWorkingWindowForDate(
    date,
    clinicSettings.appointmentSchedule,
  );

  if (!workingWindow) {
    return [];
  }

  const slots = buildHalfHourTimeOptions({
    startMinutes: workingWindow.startMinutes,
    endMinutes: workingWindow.endMinutes - durationMinutes,
    includeEnd: true,
  }).map((slot) => ({ time: slot.value, taken: false }));

  if (!hasSupabaseEnv() && !hasGoogleCalendarEnv()) {
    return slots;
  }

  const { start: dayStart, end: dayEnd } = getBucharestDayBounds(date);
  const startIso = formatISO(dayStart);
  const endIso = formatISO(dayEnd);

  const appointmentsPromise = hasSupabaseEnv()
    ? createSupabaseAdminClient()
        .from("appointments")
        .select("start_at, end_at, status")
        .eq("resource_id", "primary-resource")
        .lt("start_at", endIso)
        .gt("end_at", startIso)
        .in("status", ["pending", "confirmed", "completed"])
    : Promise.resolve({ data: [], error: null });

  const googleBusyRangesPromise = hasGoogleCalendarEnv()
    ? getGoogleCalendarBusyRanges({
        startAt: startIso,
        endAt: endIso,
      }).catch((error) => {
        log("error", "Google Calendar availability lookup failed", {
          date,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
      })
    : Promise.resolve([]);
  const calendarBlocksPromise = hasSupabaseEnv()
    ? Promise.all([
        listAvailabilityBlockingRanges({
          from: dayStart,
          to: dayEnd,
        }),
        listExternalCalendarBlockingRanges({
          from: dayStart,
          to: dayEnd,
        }),
      ]).then(([calendarBlocks, externalCalendarEvents]) => [
        ...calendarBlocks,
        ...externalCalendarEvents,
      ])
    : Promise.resolve([]);

  const [appointmentsResult, googleBusyRanges, calendarBlocks] = await Promise.all([
    appointmentsPromise,
    googleBusyRangesPromise,
    calendarBlocksPromise,
  ]);

  if (appointmentsResult.error) {
    log("error", "Supabase availability lookup failed", {
      date,
      error: appointmentsResult.error.message,
    });
  }

  const appointments = appointmentsResult.data ?? [];

  return slots.map((slot) => {
    const slotStart = toDateTime(date, slot.time);
    const slotEnd = addMinutes(slotStart, durationMinutes);
    const hasSupabaseConflict = appointments.some((appointment) => {
      const start = new Date(appointment.start_at);
      const endTime = new Date(appointment.end_at);
      return slotStart < endTime && slotEnd > start;
    });
    const hasGoogleConflict = googleBusyRanges.some((range) => {
      if (!range) {
        return false;
      }

      return slotStart < range.end && slotEnd > range.start;
    });
    const hasCalendarBlockConflict = calendarBlocks.some(
      (range) => slotStart < range.end && slotEnd > range.start,
    );

    return {
      ...slot,
      taken: hasSupabaseConflict || hasGoogleConflict || hasCalendarBlockConflict,
    };
  });
}

export async function createPublicAppointment(input: PublicAppointmentInput) {
  const offerings = await getServiceOfferings();
  const service = findServiceOfferingByIdentifier(offerings, input.serviceSlug);
  if (!service) {
    throw new Error("Serviciul selectat nu este disponibil.");
  }

  const durationMinutes = service?.durationMinutes ?? 60;
  const startAt = toDateTime(input.date, input.time);
  const endAt = addMinutes(startAt, durationMinutes);

  if (!hasSupabaseEnv()) {
    throw new Error("Configureaza Supabase pentru a activa programarile.");
  }

  await assertSlotAvailable({
    startAt,
    endAt,
    resourceId: "primary-resource",
  });

  const supabase = createSupabaseAdminClient();
  const clinicSettings = await getClinicSettings();
  let persistedServiceOfferingId: string | null = null;

  try {
    persistedServiceOfferingId = await ensureServiceOfferingPersisted(service);
  } catch (error) {
    log("warn", "Failed to persist service offering before appointment insert", {
      serviceId: service.id,
      serviceTitle: service.title,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const normalizedName = sanitizePlainText(input.name);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const sanitizedPhone = sanitizePlainText(input.phone);

  const patientPayload = {
    full_name: normalizedName,
    normalized_name: normalizedName.toLowerCase(),
    email: normalizedEmail,
    normalized_email: normalizedEmail,
    phone: sanitizedPhone,
    normalized_phone: normalizedPhone,
    updated_at: new Date().toISOString(),
  };

  let patientId = input.patientId ?? null;

  if (patientId) {
    const patientUpdate = await supabase
      .from("patients")
      .update({
        ...patientPayload,
        auth_user_id: input.authUserId ?? undefined,
      })
      .eq("id", patientId)
      .select("id")
      .single();

    patientId = patientUpdate.data?.id ?? null;
  } else {
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .or(`normalized_email.eq.${normalizedEmail},normalized_phone.eq.${normalizedPhone}`)
      .maybeSingle();

    patientId = existingPatient?.id
      ? existingPatient.id
      : (
          await supabase
            .from("patients")
            .insert(patientPayload)
            .select("id")
            .single()
        ).data?.id ?? null;
  }

  if (!patientId) {
    throw new Error("Nu am putut crea pacientul.");
  }

  const publicReferenceCode = createPublicReferenceCode();
  const publicReferenceCodeHash = hashPublicReferenceCode(publicReferenceCode);
  const patientQuestionnaire = await getPatientQuestionnaireStatus(patientId);
  const appointmentStatus: AppointmentStatus =
    clinicSettings.requireManualAppointmentConfirmation ? "pending" : "confirmed";
  const intakeStatus: AppointmentIntakeStatus =
    input.isFirstVisit && patientQuestionnaire.state !== "completed"
      ? "required_pending"
      : "not_required";
  const now = new Date().toISOString();
  const appointmentSource = input.source ?? (input.authUserId ? "patient_account" : "public_site");

  const appointmentInsert = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      service_offering_id: persistedServiceOfferingId,
      resource_id: "primary-resource",
      start_at: formatISO(startAt),
      end_at: formatISO(endAt),
      timezone: "Europe/Bucharest",
      status: appointmentStatus,
      source: appointmentSource,
      is_first_visit: input.isFirstVisit,
      requested_at: now,
      confirmed_at: appointmentStatus === "confirmed" ? now : null,
      sync_status: "pending",
      contact_name: normalizedName,
      contact_email: normalizedEmail,
      contact_email_normalized: normalizedEmail,
      contact_phone: sanitizedPhone,
      public_reference_code_hash: publicReferenceCodeHash,
      public_reference_code_hint: getPublicReferenceCodeHint(publicReferenceCode),
      public_reference_sent_at: now,
      intake_status: intakeStatus,
      created_by: input.authUserId ?? null,
      updated_by: input.authUserId ?? null,
    })
    .select(APPOINTMENT_SELECT)
    .single();

  if (appointmentInsert.error || !appointmentInsert.data) {
    if (appointmentInsert.error?.code === "23P01") {
      throw new Error("Intervalul selectat nu mai este disponibil.");
    }

    throw new Error(
      appointmentInsert.error?.message ?? "Nu am putut salva programarea.",
    );
  }

  const appointment = appointmentInsert.data as AppointmentRecord;
  const syncResult = await syncAppointmentCalendar(appointment, "create");

  await supabase.from("appointment_status_history").insert({
    appointment_id: appointment.id,
    old_status: null,
    new_status: appointmentStatus,
    note:
      appointmentStatus === "confirmed"
        ? "Programare noua confirmata automat de pe site."
        : "Programare noua trimisa de pe site.",
  });

  await writeAuditLog({
    actorId: input.authUserId ?? null,
    entityType: "appointment",
    entityId: String(appointment.id),
    action: appointmentSource === "patient_account" ? "patient-created" : "public-created",
    after: {
      status: appointmentStatus,
      service: service.title,
      startAt: formatISO(startAt),
      syncStatus: syncResult.syncStatus,
      source: appointmentSource,
      intakeStatus,
      questionnaireState: patientQuestionnaire.state,
    },
  });

  await sendAppointmentEmails({
    appointmentId: String(appointment.id),
    name: input.name,
    email: input.email,
    phone: input.phone,
    service: service.title,
    startLabel: startAt.toLocaleString("ro-RO"),
    isFirstVisit: input.isFirstVisit,
    status: appointmentStatus,
    publicReferenceCode,
    resumeUrl: `${getPublicSiteUrl()}/programare/status`,
    intakeStatus,
  });

  return {
    appointmentId: String(appointment.id),
    syncStatus: syncResult.syncStatus,
    status: appointmentStatus,
    requiresIntake: intakeStatus === "required_pending",
    publicReferenceCode,
  };
}

export async function createAdminAppointment(input: AdminAppointmentInput) {
  const offerings = await getServiceOfferings({
    admin: true,
    includeHidden: false,
  });
  const service = findServiceOfferingByIdentifier(offerings, input.serviceSlug);
  if (!service || !service.bookable) {
    throw new Error("Serviciul selectat nu este disponibil pentru programare.");
  }

  const durationMinutes = service.durationMinutes ?? 60;
  const startAt = toDateTime(input.date, input.time);
  const endAt = addMinutes(startAt, durationMinutes);

  if (!hasSupabaseEnv()) {
    throw new Error("Configureaza Supabase pentru a activa programarile.");
  }

  await assertSlotAvailable({
    startAt,
    endAt,
    resourceId: "primary-resource",
  });

  const supabase = createSupabaseAdminClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, full_name, email, phone")
    .eq("id", input.patientId)
    .single();

  if (patientError || !patient) {
    throw new Error("Pacientul selectat nu a fost gasit.");
  }

  let persistedServiceOfferingId: string | null = null;

  try {
    persistedServiceOfferingId = await ensureServiceOfferingPersisted(service);
  } catch (error) {
    log("warn", "Failed to persist service offering before admin appointment insert", {
      serviceId: service.id,
      serviceTitle: service.title,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const normalizedName = sanitizePlainText(input.name ?? patient.full_name ?? "");
  const normalizedEmail = normalizeEmail(input.email ?? patient.email ?? "");
  const normalizedPhone = normalizePhone(input.phone ?? patient.phone ?? "");
  const sanitizedPhone = sanitizePlainText(input.phone ?? patient.phone ?? "");

  if (!normalizedName || !normalizedEmail || !sanitizedPhone || !normalizedPhone) {
    throw new Error("Pacientul trebuie sa aiba nume, email si telefon pentru confirmare.");
  }

  const patientUpdate = await supabase
    .from("patients")
    .update({
      full_name: normalizedName,
      normalized_name: normalizedName.toLowerCase(),
      email: normalizedEmail,
      normalized_email: normalizedEmail,
      phone: sanitizedPhone,
      normalized_phone: normalizedPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.patientId)
    .select("id")
    .single();

  if (patientUpdate.error || !patientUpdate.data) {
    throw new Error(
      patientUpdate.error?.message ?? "Nu am putut actualiza datele pacientului.",
    );
  }

  const publicReferenceCode = createPublicReferenceCode();
  const publicReferenceCodeHash = hashPublicReferenceCode(publicReferenceCode);
  const patientQuestionnaire = await getPatientQuestionnaireStatus(input.patientId);
  const appointmentStatus: AppointmentStatus = "confirmed";
  const intakeStatus: AppointmentIntakeStatus =
    input.isFirstVisit && patientQuestionnaire.state !== "completed"
      ? "required_pending"
      : "not_required";
  const now = new Date().toISOString();

  const appointmentInsert = await supabase
    .from("appointments")
    .insert({
      patient_id: input.patientId,
      service_offering_id: persistedServiceOfferingId,
      resource_id: "primary-resource",
      start_at: formatISO(startAt),
      end_at: formatISO(endAt),
      timezone: "Europe/Bucharest",
      status: appointmentStatus,
      source: "admin_panel",
      is_first_visit: input.isFirstVisit,
      requested_at: now,
      confirmed_at: now,
      sync_status: "pending",
      contact_name: normalizedName,
      contact_email: normalizedEmail,
      contact_email_normalized: normalizedEmail,
      contact_phone: sanitizedPhone,
      public_reference_code_hash: publicReferenceCodeHash,
      public_reference_code_hint: getPublicReferenceCodeHint(publicReferenceCode),
      public_reference_sent_at: now,
      intake_status: intakeStatus,
      created_by: input.adminUserId,
      updated_by: input.adminUserId,
    })
    .select(APPOINTMENT_SELECT)
    .single();

  if (appointmentInsert.error || !appointmentInsert.data) {
    if (appointmentInsert.error?.code === "23P01") {
      throw new Error("Intervalul selectat nu mai este disponibil.");
    }

    throw new Error(
      appointmentInsert.error?.message ?? "Nu am putut salva programarea.",
    );
  }

  const appointment = appointmentInsert.data as AppointmentRecord;
  const syncResult = await syncAppointmentCalendar(appointment, "create");

  await supabase.from("appointment_status_history").insert({
    appointment_id: appointment.id,
    old_status: null,
    new_status: appointmentStatus,
    note: "Programare noua creata din admin.",
  });

  await writeAuditLog({
    actorId: input.adminUserId,
    entityType: "appointment",
    entityId: String(appointment.id),
    action: "admin-created",
    after: {
      status: appointmentStatus,
      service: service.title,
      startAt: formatISO(startAt),
      syncStatus: syncResult.syncStatus,
      source: "admin_panel",
      intakeStatus,
      questionnaireState: patientQuestionnaire.state,
    },
  });

  await sendAppointmentEmails({
    appointmentId: String(appointment.id),
    name: normalizedName,
    email: normalizedEmail,
    phone: sanitizedPhone,
    service: service.title,
    startLabel: startAt.toLocaleString("ro-RO"),
    isFirstVisit: input.isFirstVisit,
    status: appointmentStatus,
    publicReferenceCode,
    resumeUrl: `${getPublicSiteUrl()}/programare/status`,
    intakeStatus,
    notifyAdmin: false,
  });

  return {
    appointmentId: String(appointment.id),
    endAt: formatISO(endAt),
    patientEmail: normalizedEmail,
    patientName: normalizedName,
    publicReferenceCode,
    requiresIntake: intakeStatus === "required_pending",
    serviceName: service.title,
    startAt: formatISO(startAt),
    status: appointmentStatus,
    syncStatus: syncResult.syncStatus,
  };
}

async function toPublicAppointmentSummary(appointment: AppointmentRecord) {
  const patient = unwrapRelation(appointment.patients);
  const service = unwrapRelation(appointment.service_offerings);
  const patientQuestionnaire = await getPatientQuestionnaireStatus(
    appointment.patient_id,
  );
  const questionnaireStatus = await resolveAppointmentQuestionnaireStatus(
    appointment,
  );

  return {
    id: appointment.id,
    patientName: appointment.contact_name ?? patient?.full_name ?? "Pacient",
    email: appointment.contact_email ?? patient?.email ?? null,
    phone: appointment.contact_phone ?? patient?.phone ?? null,
    serviceName: service?.name ?? "Programare",
    status: appointment.status,
    statusLabel: appointmentStatusCopy(appointment.status),
    startAt: appointment.start_at,
    endAt: appointment.end_at,
    isFirstVisit: appointment.is_first_visit,
    intakeStatus: appointment.intake_status,
    intakeSubmittedAt: appointment.intake_submitted_at,
    publicReferenceHint: appointment.public_reference_code_hint,
    syncStatus: appointment.sync_status,
    hasIntakeDocument: Boolean(appointment.intake_document_id),
    questionnaireStatus,
    questionnaireCompletedAt: patientQuestionnaire.completedAt,
    questionnaireVersionId:
      patientQuestionnaire.completedVersionId ?? patientQuestionnaire.currentVersionId,
  };
}

export async function lookupAppointmentByReference(input: {
  email: string;
  code: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedCode = normalizeBookingReferenceCode(input.code);

  if (!normalizedEmail || !normalizedCode) {
    return null;
  }

  const appointment = await getAppointmentLookupRecord({
    normalizedEmail,
    codeHash: hashPublicReferenceCode(normalizedCode),
  });

  if (!appointment) {
    return null;
  }

  return await toPublicAppointmentSummary(appointment);
}

export async function getPublicAppointmentSummaryById(appointmentId: string) {
  const appointment = await getAppointmentRecord(appointmentId);
  return await toPublicAppointmentSummary(appointment);
}

export async function getAppointmentForAuthenticatedPatient(input: {
  appointmentId: string;
  authUserId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`${APPOINTMENT_SELECT}, ownership_patient:patients!inner(auth_user_id)`)
    .eq("id", input.appointmentId)
    .eq("ownership_patient.auth_user_id", input.authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AppointmentRecord | null) ?? null;
}

export async function refreshAppointmentCalendarMetadata(input: {
  appointmentId: string;
  actorId?: string | null;
  reason?: string;
}) {
  const appointment = await getAppointmentRecord(input.appointmentId);
  const syncAction =
    appointment.status === "cancelled"
      ? "delete"
      : appointment.google_event_id
        ? "update"
        : "create";
  const syncResult = await syncAppointmentCalendar(appointment, syncAction);

  await writeAuditLog({
    actorId: input.actorId ?? null,
    entityType: "appointment",
    entityId: appointment.id,
    action: "appointment-metadata-sync",
    after: {
      syncStatus: syncResult.syncStatus,
      reason: input.reason ?? null,
    },
  });

  return syncResult;
}

export async function updateAppointmentByAdmin(input: {
  appointmentId: string;
  status: AppointmentStatus;
  date: string;
  time: string;
  adminNotes?: string;
  actorId?: string | null;
}) {
  if (!hasSupabaseEnv()) {
    throw new Error("Configureaza Supabase pentru a activa administrarea programarilor.");
  }

  const supabase = createSupabaseAdminClient();
  const appointment = await getAppointmentRecord(input.appointmentId);
  const service = unwrapRelation(appointment.service_offerings);
  const durationMinutes =
    service?.duration_minutes ??
    Math.max(differenceInMinutes(new Date(appointment.end_at), new Date(appointment.start_at)), 30);
  const nextStartAt = toDateTime(input.date, input.time);
  const nextEndAt = addMinutes(nextStartAt, durationMinutes);
  const sanitizedNotes = sanitizePlainText(input.adminNotes ?? "");
  const beforeStatus = appointment.status;
  const slotChanged =
    formatISO(nextStartAt) !== appointment.start_at || formatISO(nextEndAt) !== appointment.end_at;

  if (input.status !== "cancelled") {
    await assertSlotAvailable({
      startAt: nextStartAt,
      endAt: nextEndAt,
      resourceId: appointment.resource_id,
      excludeAppointmentId: appointment.id,
      excludeGoogleEventId: appointment.google_event_id,
    });
  }

  const timestampUpdate = {
    confirmed_at: input.status === "confirmed" ? new Date().toISOString() : appointment.confirmed_at,
    cancelled_at: input.status === "cancelled" ? new Date().toISOString() : null,
    completed_at: input.status === "completed" ? new Date().toISOString() : null,
  };

  const updateResult = await supabase
    .from("appointments")
    .update({
      status: input.status,
      start_at: formatISO(nextStartAt),
      end_at: formatISO(nextEndAt),
      admin_notes: sanitizedNotes || null,
      updated_by: input.actorId ?? null,
      ...timestampUpdate,
    })
    .eq("id", appointment.id)
    .select(APPOINTMENT_SELECT)
    .single();

  if (updateResult.error || !updateResult.data) {
    if (updateResult.error?.code === "23P01") {
      throw new Error("Intervalul selectat nu mai este disponibil.");
    }

    throw new Error(updateResult.error?.message ?? "Nu am putut actualiza programarea.");
  }

  const updatedAppointment = updateResult.data as AppointmentRecord;
  const syncAction = input.status === "cancelled" ? "delete" : appointment.google_event_id ? "update" : "create";
  const syncResult = await syncAppointmentCalendar(updatedAppointment, syncAction);

  await supabase.from("appointment_status_history").insert({
    appointment_id: appointment.id,
    old_status: beforeStatus,
    new_status: input.status,
    actor_user_id: input.actorId ?? null,
    note: slotChanged ? "Programare reprogramata din dashboard." : "Status actualizat din dashboard.",
  });

  await writeAuditLog({
    actorId: input.actorId ?? null,
    entityType: "appointment",
    entityId: appointment.id,
    action: slotChanged ? "admin-rescheduled" : "admin-updated",
    before: {
      status: appointment.status,
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      syncStatus: appointment.sync_status,
    },
    after: {
      status: input.status,
      startAt: updatedAppointment.start_at,
      endAt: updatedAppointment.end_at,
      syncStatus: syncResult.syncStatus,
    },
  });

  const patient = unwrapRelation(updatedAppointment.patients);
  const offering = unwrapRelation(updatedAppointment.service_offerings);

  if (patient?.email) {
    await sendAppointmentStatusUpdateEmail({
      appointmentId: appointment.id,
      email: patient.email,
      name: patient.full_name ?? "Pacient",
      service: offering?.name ?? "Programare",
      startLabel: new Date(updatedAppointment.start_at).toLocaleString("ro-RO"),
      status: input.status,
    });
  }

  return {
    appointmentId: appointment.id,
    syncStatus: syncResult.syncStatus,
  };
}

export async function retryAppointmentCalendarSync(input: {
  appointmentId: string;
  actorId?: string | null;
}) {
  if (!hasSupabaseEnv()) {
    throw new Error("Configureaza Supabase pentru a activa sincronizarea.");
  }

  const appointment = await getAppointmentRecord(input.appointmentId);
  const syncAction = appointment.status === "cancelled" ? "delete" : appointment.google_event_id ? "update" : "create";
  const syncResult = await syncAppointmentCalendar(appointment, syncAction);

  await writeAuditLog({
    actorId: input.actorId ?? null,
    entityType: "appointment",
    entityId: appointment.id,
    action: "admin-retry-sync",
    after: {
      syncStatus: syncResult.syncStatus,
    },
  });

  return syncResult;
}
