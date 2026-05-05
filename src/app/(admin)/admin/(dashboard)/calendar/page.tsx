import { AdminCalendar } from "@/components/admin/admin-calendar";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listCalendarBlocks } from "@/modules/calendar-blocks/service";
import { listExternalCalendarEvents } from "@/modules/external-calendar-events/service";
import { requireOwnerAdminAal2User } from "@/modules/auth/guards";
import { getClinicSettings } from "@/modules/settings/service";
import type {
  AppointmentIntakeStatus,
  AppointmentSource,
  AppointmentSyncStatus,
} from "@/modules/appointments/types";

type AppointmentStatus = "cancelled" | "completed" | "confirmed" | "pending";

type AppointmentRow = {
  admin_notes: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  end_at: string;
  id: string;
  intake_status: AppointmentIntakeStatus;
  is_first_visit: boolean;
  patient_id: string | null;
  patients:
    | {
        email?: string | null;
        full_name?: string | null;
        phone?: string | null;
      }
    | {
        email?: string | null;
        full_name?: string | null;
        phone?: string | null;
      }[]
    | null;
  public_reference_code_hint: string | null;
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
  source: AppointmentSource | null;
  sync_status: AppointmentSyncStatus;
};

function unwrapRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function getCalendarWindow() {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(now.getMonth() - 6);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const to = new Date(now);
  to.setMonth(now.getMonth() + 12);
  to.setDate(1);
  to.setHours(0, 0, 0, 0);

  return { from, to };
}

export default async function AdminCalendarPage() {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminAal2User();

  const { from, to } = getCalendarWindow();
  const supabase = createSupabaseAdminClient();
  const [appointmentsResult, blocks, externalEvents, clinicSettings] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, patient_id, status, sync_status, source, intake_status, is_first_visit, public_reference_code_hint, admin_notes, start_at, end_at, contact_name, contact_email, contact_phone, patients(full_name, email, phone), service_offerings(name)",
      )
      .lt("start_at", to.toISOString())
      .gt("end_at", from.toISOString())
      .order("start_at", { ascending: true }),
    listCalendarBlocks({ from, to }),
    listExternalCalendarEvents({ from, to }),
    getClinicSettings(),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  const appointmentEvents = ((appointmentsResult.data ?? []) as AppointmentRow[]).map(
    (appointment) => {
      const patient = unwrapRelation(appointment.patients);
      const service = unwrapRelation(appointment.service_offerings);
      const patientName =
        appointment.contact_name ?? patient?.full_name ?? "Pacient fara nume";
      const email = appointment.contact_email ?? patient?.email ?? null;
      const phone = appointment.contact_phone ?? patient?.phone ?? null;

      return {
        adminNotes: appointment.admin_notes,
        appointmentHref: `/admin/appointments/${appointment.id}`,
        contact: email ?? phone ?? null,
        email,
        endAt: appointment.end_at,
        href: `/admin/appointments/${appointment.id}`,
        id: appointment.id,
        intakeStatus: appointment.intake_status,
        isFirstVisit: appointment.is_first_visit,
        kind: "appointment" as const,
        patientId: appointment.patient_id,
        patientName,
        patientProfileHref: appointment.patient_id
          ? `/admin/patients/${appointment.patient_id}`
          : null,
        phone,
        referenceHint: appointment.public_reference_code_hint,
        serviceName: service?.name ?? "Programare",
        source: appointment.source,
        startAt: appointment.start_at,
        status: appointment.status,
        syncStatus: appointment.sync_status,
        title: patientName,
      };
    },
  );

  const blockEvents = blocks.map((block) => ({
    blockType: block.blockType,
    color: block.color,
    description: block.description,
    endAt: block.endAt,
    id: block.id,
    kind: "block" as const,
    startAt: block.startAt,
    title: block.title,
  }));

  const externalAppointmentEvents = externalEvents
    .filter((event) => event.status === "active")
    .map((event) => ({
      description: event.description,
      endAt: event.endAt,
      googleCalendarHref: event.htmlLink,
      googleEventId: event.googleEventId,
      id: event.id,
      kind: "external_appointment" as const,
      location: event.location,
      startAt: event.startAt,
      title: event.summary,
    }));

  return (
    <AdminCalendar
      appointmentSchedule={clinicSettings.appointmentSchedule}
      events={[...appointmentEvents, ...externalAppointmentEvents, ...blockEvents]}
      loadedFrom={from.toISOString()}
      loadedTo={to.toISOString()}
    />
  );
}
