import Link from "next/link";

import { AdminDashboardTodayDrawer } from "@/components/admin/admin-dashboard-today-drawer";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBucharestDayBounds } from "@/lib/utils/dates";
import { requireOwnerAdminUser } from "@/modules/auth/guards";

type AppointmentRow = {
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  id: string;
  patients: { full_name?: string } | null;
  service_offerings: { name?: string } | null;
  start_at: string;
  status: string;
};

type AuditRow = {
  action: string;
  created_at: string;
  entity_type: string;
};

type DocumentRow = {
  created_at: string;
  document_type: string;
  id: string;
  patients: { full_name?: string } | null;
};

type ActivityAppointmentRow = {
  patient_id: string | null;
  start_at: string;
  status: string;
};

const fullDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ro-RO", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

const compactNumberFormatter = new Intl.NumberFormat("ro-RO", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const bucharestHourFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Bucharest",
});

const DAY_MS = 1000 * 60 * 60 * 24;
const ACTIVITY_WEEK_COUNT = 12;

function getDayParts(date: Date) {
  return dayKeyFormatter.formatToParts(date).reduce<Record<string, string>>(
    (accumulator, part) => {
      if (part.type !== "literal") {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    },
    {},
  );
}

function getTodayKey() {
  const parts = getDayParts(new Date());
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getMonthStartIso() {
  const parts = getDayParts(new Date());

  return getBucharestDayBounds(`${parts.year}-${parts.month}-01`).start.toISOString();
}

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

function formatDate(value: string) {
  return fullDateFormatter.format(new Date(value));
}

function getGreetingLabel(date: Date) {
  const hour = Number(
    bucharestHourFormatter.formatToParts(date).find((part) => part.type === "hour")?.value ?? "0",
  );

  if (hour >= 5 && hour < 12) {
    return "Buna dimineata";
  }

  if (hour >= 12 && hour < 18) {
    return "Buna ziua";
  }

  return "Buna seara";
}

function formatRelativeStamp(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes} min in urma`;
  }

  if (diffHours < 24) {
    return `${diffHours} ore in urma`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} zile in urma`;
}

function formatAuditMessage(entry: AuditRow) {
  const entity = entry.entity_type.replace(/_/g, " ");
  const action = entry.action.replace(/_/g, " ");
  return `${entity}: ${action}.`;
}

function formatAppointmentStatus(value: string) {
  if (value === "pending") return "In asteptare";
  if (value === "confirmed") return "Confirmata";
  if (value === "cancelled") return "Anulata";
  if (value === "completed") return "Finalizata";
  return value.replace(/_/g, " ");
}

function formatSignedCount(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return value.toString();
}

function appointmentStatusClass(value: string) {
  if (value === "confirmed") {
    return "bg-[#f9f3ea] text-[#5f5b55]";
  }

  if (value === "pending") {
    return "bg-[#ffdcbd] text-[#654d35]";
  }

  if (value === "cancelled") {
    return "bg-[#fe8983]/55 text-[#752121]";
  }

  return "bg-[#e2e3d9] text-[#5e6058]";
}

function getPersonLabel(appointment: AppointmentRow) {
  return appointment.patients?.full_name ?? appointment.contact_name ?? "Pacient";
}

function getServiceLabel(appointment: AppointmentRow) {
  return (
    appointment.service_offerings?.name ??
    (appointment.status === "pending" ? "Cerere de programare" : "Consultatie")
  );
}

function getInitials(value: string) {
  const tokens = value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "PT";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getIsoWeekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function getActivityRangeStart(date: Date) {
  return addDays(getIsoWeekStart(date), -7 * (ACTIVITY_WEEK_COUNT - 1));
}

function getActivityRangeEnd(date: Date) {
  return addDays(getIsoWeekStart(date), 7);
}

function getIsoWeekNumber(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

function buildActivity(appointments: ActivityAppointmentRow[], referenceDate = new Date()) {
  const rangeStartDate = getActivityRangeStart(referenceDate);
  const rangeStart = rangeStartDate.getTime();

  const buckets = Array.from({ length: ACTIVITY_WEEK_COUNT }, (_, index) => {
    const weekStart = addDays(rangeStartDate, index * 7);
    const weekNumber = getIsoWeekNumber(weekStart);

    return {
      count: 0,
      index,
      label: `S${weekNumber}`,
      weekNumber,
    };
  });

  appointments.forEach((appointment) => {
    const timestamp = new Date(appointment.start_at).getTime();
    const offset = timestamp - rangeStart;

    if (offset < 0) {
      return;
    }

    const bucketIndex = Math.floor(offset / (DAY_MS * 7));

    if (bucketIndex >= ACTIVITY_WEEK_COUNT) {
      return;
    }

    buckets[bucketIndex].count += 1;
  });

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const enhancedBuckets = buckets.map((bucket) => ({
    ...bucket,
    height: Math.max(18, Math.round((bucket.count / maxCount) * 100)),
    isPeak: bucket.count === maxCount && bucket.count > 0,
  }));
  const currentWeek = enhancedBuckets[enhancedBuckets.length - 1];
  const previousWeek = enhancedBuckets[enhancedBuckets.length - 2];
  const totalAppointments = enhancedBuckets.reduce((total, bucket) => total + bucket.count, 0);
  const activeAppointments = appointments.filter((appointment) => appointment.status !== "cancelled");
  const uniquePatientCount = new Set(
    activeAppointments
      .map((appointment) => appointment.patient_id)
      .filter((patientId): patientId is string => Boolean(patientId)),
  ).size;
  const peakBucket = enhancedBuckets.reduce(
    (peak, bucket) => (bucket.count > peak.count ? bucket : peak),
    enhancedBuckets[0],
  );

  return {
    averagePerWeek: totalAppointments / ACTIVITY_WEEK_COUNT,
    buckets: enhancedBuckets,
    currentWeekCount: currentWeek?.count ?? 0,
    peakWeekCount: peakBucket?.count ?? 0,
    peakWeekLabel: peakBucket?.label ?? "Sapt.",
    previousWeekCount: previousWeek?.count ?? 0,
    totalAppointments,
    uniquePatientCount,
    weekDelta: (currentWeek?.count ?? 0) - (previousWeek?.count ?? 0),
  };
}

async function getOverview() {
  if (!hasServerEnv()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const todayBounds = getBucharestDayBounds(getTodayKey());
  const monthStartIso = getMonthStartIso();
  const chartRangeIso = getActivityRangeStart(now).toISOString();
  const chartRangeEndIso = getActivityRangeEnd(now).toISOString();

  const [
    patientCount,
    newPatientsThisMonth,
    appointmentsToday,
    appointmentsTodayList,
    pendingReviews,
    upcomingAppointments,
    recentlyCreatedAppointments,
    syncIssues,
    auditLog,
    recentDocuments,
    activityAppointments,
  ] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStartIso),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("start_at", todayBounds.start.toISOString())
      .lt("start_at", todayBounds.end.toISOString()),
    supabase
      .from("appointments")
      .select(
        "id, status, start_at, created_at, contact_name, contact_email, contact_phone, patients(full_name), service_offerings(name)",
      )
      .gte("start_at", todayBounds.start.toISOString())
      .lt("start_at", todayBounds.end.toISOString())
      .order("start_at", { ascending: true }),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("appointments")
      .select(
        "id, status, start_at, created_at, contact_name, contact_email, contact_phone, patients(full_name), service_offerings(name)",
      )
      .gte("start_at", now.toISOString())
      .order("start_at", { ascending: true })
      .limit(4),
    supabase
      .from("appointments")
      .select(
        "id, status, start_at, created_at, contact_name, contact_email, contact_phone, patients(full_name), service_offerings(name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .neq("sync_status", "synced"),
    supabase
      .from("admin_audit_log")
      .select("action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("generated_documents")
      .select("id, document_type, created_at, patients(full_name)")
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("appointments")
      .select("patient_id, start_at, status")
      .gte("start_at", chartRangeIso)
      .lt("start_at", chartRangeEndIso)
      .order("start_at", { ascending: true }),
  ]);

  return {
    activity: buildActivity((activityAppointments.data ?? []) as ActivityAppointmentRow[], now),
    appointmentCountToday: appointmentsToday.count ?? 0,
    dateLabel: fullDateFormatter.format(now),
    greetingLabel: getGreetingLabel(now),
    newPatientsThisMonth: newPatientsThisMonth.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    recentAuditLog: (auditLog.data ?? []) as AuditRow[],
    recentDocuments: (recentDocuments.data ?? []) as DocumentRow[],
    recentlyCreatedAppointments: (recentlyCreatedAppointments.data ?? []) as AppointmentRow[],
    syncIssueCount: syncIssues.count ?? 0,
    todayAppointments: (appointmentsTodayList.data ?? []) as AppointmentRow[],
    totalPatients: patientCount.count ?? 0,
    upcomingAppointments: (upcomingAppointments.data ?? []) as AppointmentRow[],
  };
}

export default async function AdminDashboardPage() {
  await requireOwnerAdminUser();

  const overview = await getOverview();

  if (!overview) {
    return <SetupNotice />;
  }

  const nextAppointment = overview.upcomingAppointments[0] ?? null;
  const nextAppointmentLabel = nextAppointment ? getPersonLabel(nextAppointment) : null;
  const nextAppointmentService = nextAppointment ? getServiceLabel(nextAppointment) : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#735a42]">
            {overview.greetingLabel}
          </span>
          <h2 className="mt-2 font-serif text-4xl text-[#31332c] md:text-5xl">
            Dr. Stefanescu
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5e6058]">
            Ai{" "}
            <span className="font-semibold text-[#31332c]">
              {overview.appointmentCountToday} consultatii
            </span>{" "}
            programate astazi. Prima urmatoare programare este prioritizata mai jos.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-6 py-3 text-sm font-semibold tracking-tight text-[#31332c]">
          <span className="text-[#735a42]">Astazi</span>
          <span>{overview.dateLabel}</span>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminDashboardTodayDrawer
          appointments={overview.todayAppointments.map((appointment) => ({
            href: `/admin/appointments/${appointment.id}`,
            id: appointment.id,
            label: getPersonLabel(appointment),
            service: getServiceLabel(appointment),
            status: appointment.status,
            statusLabel: formatAppointmentStatus(appointment.status),
            time: formatTime(appointment.start_at),
          }))}
          totalCount={overview.appointmentCountToday}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffdcbd]">
                Urmatoarea programare
              </p>
              {nextAppointment ? (
                <>
                  <h3 className="mt-5 font-serif text-5xl leading-none tracking-[-0.04em] md:text-6xl">
                    {nextAppointmentLabel}
                  </h3>
                  <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#faf7f6]/75">
                    {nextAppointmentService}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="mt-5 font-serif text-5xl leading-none tracking-[-0.04em] md:text-6xl">
                    Calendar liber
                  </h3>
                  <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#faf7f6]/75">
                    Nu exista programari viitoare. Poti crea urmatoarea programare direct din admin.
                  </p>
                </>
              )}
            </div>

            {nextAppointmentLabel ? (
              <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd] text-xl font-bold text-[#654d35] sm:flex">
                {getInitials(nextAppointmentLabel)}
              </span>
            ) : null}
          </div>

          {nextAppointment ? (
            <div className="mt-8 grid gap-4 rounded-[2rem] bg-white/8 p-5 ring-1 ring-white/10 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${appointmentStatusClass(
                      nextAppointment.status,
                    )}`}
                  >
                    {formatAppointmentStatus(nextAppointment.status)}
                  </span>
                  <span className="inline-flex rounded-full bg-[#faf7f6]/10 px-3 py-1.5 text-xs font-bold text-[#faf7f6]">
                    {formatDate(nextAppointment.start_at)}
                  </span>
                </div>
                <p className="mt-5 font-serif text-5xl leading-none">
                  {formatTime(nextAppointment.start_at)}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#faf7f6]/60">
                  Creat {formatRelativeStamp(nextAppointment.created_at)}
                </p>
              </div>
              <Link
                className="admin-dashboard-next-appointment-link inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffdcbd] px-6 text-sm font-bold !text-[#0e0e0c] transition hover:bg-[#f0cfb0] hover:!text-[#0e0e0c] focus-visible:!text-[#0e0e0c]"
                href={`/admin/appointments/${nextAppointment.id}`}
              >
                Deschide programarea
              </Link>
            </div>
          ) : (
            <Link
              className="admin-dashboard-next-appointment-link mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffdcbd] px-6 text-sm font-bold !text-[#0e0e0c] transition hover:bg-[#f0cfb0] hover:!text-[#0e0e0c] focus-visible:!text-[#0e0e0c]"
              href="/admin/appointments/new"
            >
              Programare noua
            </Link>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#faf7f6]/50">
                Astazi
              </p>
              <p className="mt-2 font-serif text-3xl text-[#faf7f6]">
                {overview.appointmentCountToday}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#faf7f6]/50">
                Evaluari
              </p>
              <p className="mt-2 font-serif text-3xl text-[#faf7f6]">
                {overview.pendingReviews}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/8 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#faf7f6]/50">
                Sync
              </p>
              <p className="mt-2 font-serif text-3xl text-[#faf7f6]">
                {overview.syncIssueCount}
              </p>
            </div>
          </div>
        </AdminDashboardTodayDrawer>

        <section className="rounded-[2.5rem] bg-white p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:p-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-3xl italic leading-none text-[#31332c]">
                Programari adaugate recent
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#797c73]">
                Ordonate dupa momentul crearii in sistem.
              </p>
            </div>
            <Link
              className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-[#735a42] transition hover:text-[#513b25]"
              href="/admin/appointments"
            >
              Vezi tot
            </Link>
          </div>

          <div className="grid gap-3">
            {overview.recentlyCreatedAppointments.length ? (
              overview.recentlyCreatedAppointments.map((appointment) => {
                const label = getPersonLabel(appointment);
                const service = getServiceLabel(appointment);

                return (
                  <Link
                    className="group grid gap-3 rounded-2xl bg-[#fbf9f4] p-4 transition hover:bg-[#f5f4ed] sm:grid-cols-[1fr_auto] sm:items-center"
                    href={`/admin/appointments/${appointment.id}`}
                    key={appointment.id}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#efeee6] text-sm font-bold text-[#5f5e5e]">
                        {getInitials(label)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-bold text-[#31332c]">
                          {label}
                        </span>
                        <span className="block truncate text-xs font-semibold uppercase tracking-[0.2em] text-[#5e6058]/70">
                          {service}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-left sm:text-right">
                        <span className="block font-serif text-xl leading-none text-[#31332c]">
                          {formatTime(appointment.start_at)}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-[#797c73]">
                          adaugata {formatRelativeStamp(appointment.created_at)}
                        </span>
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e9e0] text-[#5f5e5e] transition group-hover:bg-[#5f5e5e] group-hover:text-white">
                        &gt;
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[2rem] bg-[#f5f4ed] px-6 py-10 text-sm font-semibold text-[#5e6058]">
                Nu exista programari adaugate recent.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#f5f4ed] p-8 transition-all hover:bg-[#efeee6]">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[100%] bg-white/45" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5e6058]">
            Total pacienti
          </p>
          <h3 className="mt-4 font-serif text-6xl text-[#31332c]">
            {overview.totalPatients}
          </h3>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ffdcbd] px-3 py-1 text-[10px] font-bold text-[#654d35]">
            +{overview.newPatientsThisMonth} luna aceasta
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#ffdcbd] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#654d35]">
            Programari astazi
          </p>
          <h3 className="mt-4 font-serif text-6xl text-[#654d35]">
            {overview.appointmentCountToday.toString().padStart(2, "0")}
          </h3>
          <div className="mt-6 flex -space-x-3">
            {overview.upcomingAppointments.slice(0, 3).map((appointment) => {
              const label = getPersonLabel(appointment);

              return (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ffdcbd] bg-[#654d35] text-[10px] font-bold text-white"
                  key={appointment.id}
                  title={label}
                >
                  {getInitials(label)}
                </div>
              );
            })}
            {overview.appointmentCountToday > 3 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ffdcbd] bg-[#31332c] text-[10px] font-bold text-white">
                +{overview.appointmentCountToday - 3}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#e2e3d9] p-8 transition-all hover:bg-[#d9dbcf]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5e6058]">
            Evaluari in asteptare
          </p>
          <h3 className="mt-4 font-serif text-6xl text-[#31332c]">
            {overview.pendingReviews}
          </h3>
          <p className="mt-4 text-sm text-[#5e6058]">
            Evaluari nutritionale care asteapta follow-up sau revizuire in panou.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 overflow-hidden rounded-[2.5rem] bg-[#f5f4ed] p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-serif text-2xl italic text-[#31332c]">
                Activitatea pacientilor
              </h3>
              <p className="text-sm text-[#5e6058]">
                Programari reale din ultimele 12 saptamani, grupate pe saptamani calendaristice.
              </p>
            </div>

            <div className="rounded-full bg-[#31332c] px-5 py-3 text-xs font-bold text-[#faf7f6]">
              Varf: {overview.activity.peakWeekLabel} / {overview.activity.peakWeekCount} programari
            </div>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-[1.5rem] bg-white/70 p-5 ring-1 ring-[#b1b3a9]/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                Total 12 sapt.
              </p>
              <p className="mt-2 font-serif text-4xl text-[#31332c]">
                {overview.activity.totalAppointments}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5e6058]">
                programari in interval
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/70 p-5 ring-1 ring-[#b1b3a9]/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                Pacienti unici
              </p>
              <p className="mt-2 font-serif text-4xl text-[#31332c]">
                {overview.activity.uniquePatientCount}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5e6058]">
                fara programari anulate
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/70 p-5 ring-1 ring-[#b1b3a9]/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#797c73]">
                Medie
              </p>
              <p className="mt-2 font-serif text-4xl text-[#31332c]">
                {compactNumberFormatter.format(overview.activity.averagePerWeek)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5e6058]">
                programari / saptamana
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[#ffdcbd]/65 p-5 ring-1 ring-[#735a42]/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#735a42]">
                Trend curent
              </p>
              <p className="mt-2 font-serif text-4xl text-[#31332c]">
                {formatSignedCount(overview.activity.weekDelta)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#654d35]">
                fata de saptamana trecuta
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/45 p-5 ring-1 ring-[#b1b3a9]/10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#797c73]">
                Volum saptamanal
              </span>
              <span className="text-xs font-bold text-[#5e6058]">
                Saptamana curenta: {overview.activity.currentWeekCount} programari
              </span>
            </div>

            <div className="flex h-56 w-full items-end justify-between gap-3 px-1 pb-1">
              {overview.activity.buckets.map((bucket) => (
                <div
                  aria-label={`Saptamana ${bucket.weekNumber}: ${bucket.count} programari`}
                  className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  key={bucket.index}
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`relative w-full overflow-hidden rounded-t-[1.4rem] transition-all duration-300 ${
                        bucket.isPeak
                          ? "bg-[#735a42] shadow-[0px_16px_32px_rgba(115,90,66,0.18)]"
                          : bucket.count > 0
                            ? "bg-[#735a42]/45 group-hover:bg-[#735a42]/60"
                            : "bg-[#e2e3d9]"
                      }`}
                      style={{ height: `${bucket.height}%` }}
                    >
                      <span
                        className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-2 py-1 text-[10px] font-black ${
                          bucket.isPeak ? "bg-[#ffdcbd] text-[#654d35]" : "bg-[#fbf9f4]/82 text-[#31332c]"
                        }`}
                      >
                        {bucket.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#654d35]">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="col-span-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-[#ffdcbd] px-2 py-1 text-[10px] font-bold text-[#654d35]">
                LOG
              </span>
              <h4 className="font-serif text-lg italic text-[#31332c]">Notite recente</h4>
            </div>
            <ul className="space-y-4">
              {overview.recentAuditLog.length ? (
                overview.recentAuditLog.map((entry, index) => (
                  <li
                    className={`border-l-2 pl-4 ${
                      index === 0 ? "border-[#ffdcbd]" : "border-[#e2e3d9]"
                    }`}
                    key={`${entry.entity_type}-${entry.created_at}-${entry.action}`}
                  >
                    <p className="text-xs font-bold text-[#5e6058]">
                      {formatRelativeStamp(entry.created_at)}
                    </p>
                    <p className="text-sm font-medium text-[#31332c]">
                      {formatAuditMessage(entry)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="border-l-2 border-[#e2e3d9] pl-4">
                  <p className="text-sm text-[#5e6058]">
                    Notitele de activitate vor aparea aici dupa ce echipa incepe sa foloseasca panoul.
                  </p>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-[2rem] bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-[#ffdcbd] px-2 py-1 text-[10px] font-bold text-[#654d35]">
                DOC
              </span>
              <h4 className="font-serif text-lg italic text-[#31332c]">Documente recente</h4>
            </div>
            <ul className="space-y-4">
              {overview.recentDocuments.length ? (
                overview.recentDocuments.map((document) => (
                  <li
                    className="flex items-center justify-between rounded-xl bg-[#efeee6] p-3"
                    key={document.id}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#31332c]">
                        {document.document_type.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 text-xs text-[#5e6058]">
                        {document.patients?.full_name ?? "Fisa pacient"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#735a42]">
                      Gata
                    </span>
                  </li>
                ))
              ) : (
                <li className="rounded-xl bg-[#efeee6] p-4 text-sm text-[#5e6058]">
                  Nu exista documente generate inca.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-[2rem] bg-[#f9f3ea] p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#5f5b55]">
                STATUS
              </span>
              <h4 className="font-serif text-lg italic text-[#5f5b55]">Starea cabinetului</h4>
            </div>
            <div className="rounded-2xl bg-white/40 p-4 backdrop-blur">
              <p className="text-sm italic text-[#5f5b55]/85">
                &quot;Eficienta apare din claritate si ritm. Ia 5 minute intre consultatii astazi.&quot;
              </p>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5f5b55]">
                Nota editoriala
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/50 bg-white/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5b55]/80">
                Stare sincronizare
              </p>
              <p className="mt-2 font-serif text-3xl text-[#31332c]">
                {overview.syncIssueCount}
              </p>
              <p className="mt-1 text-sm text-[#5f5b55]/80">
                programari mai necesita verificare in Google Calendar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
