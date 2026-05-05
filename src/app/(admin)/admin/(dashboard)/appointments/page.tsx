import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  FilterX,
  Mail,
  MoreVertical,
  Search,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { isValid, parseISO } from "date-fns";

import {
  AppointmentDateFilter,
  AppointmentFilterSelect,
} from "@/components/admin/appointment-filter-fields";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBucharestDayBounds } from "@/lib/utils/dates";
import { requireOwnerAdminUser } from "@/modules/auth/guards";
import type {
  AppointmentIntakeStatus,
  AppointmentStatus,
  AppointmentSyncStatus,
} from "@/modules/appointments/types";
import { getServiceOfferings } from "@/modules/pricing/service";

type AdminAppointmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AppointmentRow = {
  id: string;
  status: AppointmentStatus;
  intake_status: AppointmentIntakeStatus;
  sync_status: AppointmentSyncStatus;
  source: string | null;
  is_first_visit: boolean;
  start_at: string;
  end_at: string;
  public_reference_code_hint: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  intake_document_id: string | null;
  patients:
    | {
        email?: string | null;
        full_name?: string | null;
        phone?: string | null;
      }[]
    | {
        email?: string | null;
        full_name?: string | null;
        phone?: string | null;
      }
    | null;
  service_offerings:
    | {
        id?: string | null;
        name?: string | null;
      }[]
    | {
        id?: string | null;
        name?: string | null;
      }
    | null;
};

const PAGE_SIZE = 20;

const statusOptions: Array<{ label: string; value: AppointmentStatus }> = [
  { label: "In asteptare", value: "pending" },
  { label: "Confirmata", value: "confirmed" },
  { label: "Anulata", value: "cancelled" },
  { label: "Finalizata", value: "completed" },
];

const intakeOptions: Array<{ label: string; value: AppointmentIntakeStatus }> = [
  { label: "Nu este necesar", value: "not_required" },
  { label: "In asteptare", value: "required_pending" },
  { label: "Trimis", value: "submitted" },
];

const syncOptions: Array<{ label: string; value: AppointmentSyncStatus }> = [
  { label: "In asteptare", value: "pending" },
  { label: "Sincronizat", value: "synced" },
  { label: "Necesita retry", value: "needs_retry" },
  { label: "Eroare", value: "failed" },
];

const sourceOptions = [
  { label: "Site public", value: "public_site" },
  { label: "Cont pacient", value: "patient_account" },
  { label: "Admin", value: "admin_panel" },
];

const bucharestDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Bucharest",
  weekday: "short",
  year: "numeric",
});

const bucharestTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

function unwrapRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isOneOf<T extends string>(value: string, options: readonly T[]): value is T {
  return options.includes(value as T);
}

function parsePositiveInteger(value: string, fallback = 1) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTodayInBucharest() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Bucharest",
    year: "numeric",
  }).formatToParts(new Date());
  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${map.year}-${map.month}-${map.day}`;
}

function sanitizeSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function formatAppointmentDate(value: string) {
  const date = parseISO(value);

  return isValid(date)
    ? bucharestDateFormatter.format(date).replace(".", "")
    : "Data indisponibila";
}

function formatAppointmentTimeRange(startAt: string, endAt: string) {
  const startDate = parseISO(startAt);
  const endDate = parseISO(endAt);

  if (!isValid(startDate) || !isValid(endDate)) {
    return "Ora indisponibila";
  }

  return `${bucharestTimeFormatter.format(startDate)} - ${bucharestTimeFormatter.format(endDate)}`;
}

function formatStatusLabel(value: string) {
  if (value === "pending") return "In asteptare";
  if (value === "confirmed") return "Confirmata";
  if (value === "cancelled") return "Anulata";
  if (value === "completed") return "Finalizata";
  return value;
}

function formatIntakeLabel(value: string) {
  if (value === "required_pending") return "In asteptare";
  if (value === "submitted") return "Trimis";
  if (value === "not_required") return "Nu este necesar";
  return value;
}

function formatSyncLabel(value: string) {
  if (value === "synced") return "Sincronizat";
  if (value === "pending") return "In asteptare";
  if (value === "needs_retry") return "Necesita retry";
  if (value === "failed") return "Eroare";
  return value;
}

function formatSourceLabel(value?: string | null) {
  if (value === "patient_account") return "Cont pacient";
  if (value === "admin_panel") return "Admin";
  if (value === "public_site") return "Site public";
  return "Sursa necunoscuta";
}

function getInitials(name: string) {
  const tokens = name
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "PS";
}

function statusBadgeClass(status: AppointmentStatus) {
  if (status === "confirmed") {
    return "bg-[#f9f3ea] text-[#5f5b55]";
  }

  if (status === "pending") {
    return "bg-[#ffdcbd] text-[#654d35]";
  }

  if (status === "cancelled") {
    return "bg-[#fe8983]/55 text-[#752121]";
  }

  return "bg-[#e2e3d9] text-[#5e6058]";
}

function statusDotClass(status: AppointmentStatus) {
  if (status === "confirmed") {
    return "bg-[#625f58]";
  }

  if (status === "pending") {
    return "bg-[#735a42]";
  }

  if (status === "cancelled") {
    return "bg-[#9f403d]";
  }

  return "bg-[#797c73]";
}

function buildAppointmentsHref(
  filters: AppointmentFilters,
  page: number,
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "page") {
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/admin/appointments?${query}` : "/admin/appointments";
}

type AppointmentFilters = {
  firstVisit: string;
  from: string;
  intake: string;
  page: string;
  q: string;
  serviceId: string;
  source: string;
  status: string;
  sync: string;
  to: string;
};

function getFilters(params: Record<string, string | string[] | undefined>) {
  const statusValues = statusOptions.map((option) => option.value);
  const intakeValues = intakeOptions.map((option) => option.value);
  const syncValues = syncOptions.map((option) => option.value);
  const sourceValues = sourceOptions.map((option) => option.value);
  const firstVisitValues = ["yes", "no"] as const;
  const rawStatus = getParam(params, "status");
  const rawIntake = getParam(params, "intake");
  const rawSync = getParam(params, "sync");
  const rawSource = getParam(params, "source");
  const rawFirstVisit = getParam(params, "firstVisit");
  const rawFrom = getParam(params, "from");
  const rawTo = getParam(params, "to");

  return {
    firstVisit: isOneOf(rawFirstVisit, firstVisitValues) ? rawFirstVisit : "",
    from: isDateInput(rawFrom) ? rawFrom : "",
    intake: isOneOf(rawIntake, intakeValues) ? rawIntake : "",
    page: getParam(params, "page"),
    q: sanitizeSearchTerm(getParam(params, "q")),
    serviceId: getParam(params, "serviceId").trim(),
    source: isOneOf(rawSource, sourceValues) ? rawSource : "",
    status: isOneOf(rawStatus, statusValues) ? rawStatus : "",
    sync: isOneOf(rawSync, syncValues) ? rawSync : "",
    to: isDateInput(rawTo) ? rawTo : "",
  } satisfies AppointmentFilters;
}

export default async function AdminAppointmentsPage({
  searchParams,
}: AdminAppointmentsPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminUser();

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const currentPage = parsePositiveInteger(filters.page);
  const rangeStart = (currentPage - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;
  const today = getTodayInBucharest();
  const todayBounds = getBucharestDayBounds(today);
  const supabase = createSupabaseAdminClient();
  const services = await getServiceOfferings({
    admin: true,
    includeHidden: true,
  });

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, status, intake_status, start_at, end_at, sync_status, source, is_first_visit, public_reference_code_hint, contact_name, contact_email, contact_phone, intake_document_id, patients(full_name, email, phone), service_offerings(id, name)",
      { count: "exact" },
    )
    .order("start_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    appointmentsQuery = appointmentsQuery.or(
      [
        `contact_name.ilike.${pattern}`,
        `contact_email.ilike.${pattern}`,
        `contact_phone.ilike.${pattern}`,
        `public_reference_code_hint.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (filters.status) {
    appointmentsQuery = appointmentsQuery.eq("status", filters.status);
  }

  if (filters.intake) {
    appointmentsQuery = appointmentsQuery.eq("intake_status", filters.intake);
  }

  if (filters.sync) {
    appointmentsQuery = appointmentsQuery.eq("sync_status", filters.sync);
  }

  if (filters.serviceId) {
    appointmentsQuery = appointmentsQuery.eq("service_offering_id", filters.serviceId);
  }

  if (filters.source) {
    appointmentsQuery = appointmentsQuery.eq("source", filters.source);
  }

  if (filters.firstVisit) {
    appointmentsQuery = appointmentsQuery.eq("is_first_visit", filters.firstVisit === "yes");
  }

  if (filters.from) {
    appointmentsQuery = appointmentsQuery.gte(
      "start_at",
      getBucharestDayBounds(filters.from).start.toISOString(),
    );
  }

  if (filters.to) {
    appointmentsQuery = appointmentsQuery.lt(
      "start_at",
      getBucharestDayBounds(filters.to).end.toISOString(),
    );
  }

  const [appointmentsResult, todayCountResult, pendingCountResult, syncCountResult] =
    await Promise.all([
      appointmentsQuery,
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("start_at", todayBounds.start.toISOString())
        .lt("start_at", todayBounds.end.toISOString()),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .in("sync_status", ["pending", "needs_retry", "failed"]),
    ]);

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
  const totalCount = appointmentsResult.count ?? appointments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const visibleFrom = totalCount === 0 ? 0 : rangeStart + 1;
  const visibleTo = Math.min(rangeStart + appointments.length, totalCount);
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== "page" && Boolean(value),
  );
  const previousHref = buildAppointmentsHref(filters, Math.max(1, currentPage - 1));
  const nextHref = buildAppointmentsHref(filters, Math.min(totalPages, currentPage + 1));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c] md:text-6xl">
            Toate programarile
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e6058]">
            O privire clara asupra consultatiilor, statusurilor, evaluarilor nutritionale si
            sincronizarii calendarului. Cauta rapid dupa pacient, telefon, email,
            cod sau filtre operationale.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Astazi"
            value={todayCountResult.count ?? 0}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="In asteptare"
            value={pendingCountResult.count ?? 0}
          />
          <StatCard
            icon={<CircleAlert className="h-4 w-4" />}
            label="De sincronizat"
            value={syncCountResult.count ?? 0}
          />
        </div>
      </header>

      <form
        className="rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-4 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]"
        method="get"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <label className="relative w-full xl:w-96">
            <span className="sr-only">Cauta programari</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#797c73]" />
            <input
              className="w-full rounded-full border-0 bg-[#efeee6] py-3 pl-11 pr-4 text-sm font-semibold text-[#31332c] outline-none ring-0 transition placeholder:text-[#5e6058]/65 focus:bg-white focus:ring-1 focus:ring-[#5f5e5e]/30"
              defaultValue={filters.q}
              name="q"
              placeholder="Cauta pacient, telefon, email sau cod..."
              type="search"
            />
          </label>

          <div className="hidden h-8 w-px bg-[#b1b3a9]/20 xl:block" />

          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <AppointmentFilterSelect
              defaultValue={filters.status}
              key={`status-${filters.status}`}
              label="Status"
              name="status"
              options={statusOptions}
              placeholder="Status"
            />
            <AppointmentFilterSelect
              defaultValue={filters.serviceId}
              key={`service-${filters.serviceId}`}
              label="Serviciu"
              name="serviceId"
              options={services.map((service) => ({
                label: service.title,
                value: service.id,
              }))}
              placeholder="Serviciu"
            />
            <AppointmentFilterSelect
              defaultValue={filters.intake}
              key={`intake-${filters.intake}`}
              label="Evaluare"
              name="intake"
              options={intakeOptions}
              placeholder="Evaluare"
            />
            <AppointmentFilterSelect
              defaultValue={filters.sync}
              key={`sync-${filters.sync}`}
              label="Sincronizare"
              name="sync"
              options={syncOptions}
              placeholder="Sync"
            />
            <AppointmentFilterSelect
              defaultValue={filters.source}
              key={`source-${filters.source}`}
              label="Sursa"
              name="source"
              options={sourceOptions}
              placeholder="Sursa"
            />
            <AppointmentFilterSelect
              defaultValue={filters.firstVisit}
              key={`firstVisit-${filters.firstVisit}`}
              label="Prima vizita"
              name="firstVisit"
              options={[
                { label: "Da", value: "yes" },
                { label: "Nu", value: "no" },
              ]}
              placeholder="Prima vizita"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <AppointmentDateFilter
            defaultValue={filters.from}
            key={`from-${filters.from}`}
            label="De la"
            name="from"
          />
          <AppointmentDateFilter
            defaultValue={filters.to}
            key={`to-${filters.to}`}
            label="Pana la"
            name="to"
          />
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#5f5e5e] px-5 text-sm font-bold text-[#faf7f6] transition hover:bg-[#535252]"
              type="submit"
            >
              Aplica filtre
            </button>
            {hasActiveFilters ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                href="/admin/appointments"
              >
                <FilterX className="h-4 w-4" />
                Reset
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      {appointmentsResult.error ? (
        <div className="rounded-[1.5rem] border border-[#fe8983]/50 bg-[#fff7f6] p-4 text-sm font-semibold text-[#752121]">
          Nu am putut incarca programarile: {appointmentsResult.error.message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-[#b1b3a9]/10 bg-white shadow-[0px_12px_32px_rgba(49,51,44,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr className="bg-[#fbf9f4]/70">
                <TableHead>Pacient</TableHead>
                <TableHead>Data & ora</TableHead>
                <TableHead>Serviciu</TableHead>
                <TableHead>Medic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Evaluare</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead align="right">Actiuni</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b1b3a9]/10 text-sm">
              {appointments.length ? (
                appointments.map((appointment) => {
                  const patient = unwrapRelation(appointment.patients);
                  const service = unwrapRelation(appointment.service_offerings);
                  const patientName =
                    appointment.contact_name ?? patient?.full_name ?? "Pacient";
                  const patientContact =
                    appointment.contact_phone ??
                    patient?.phone ??
                    appointment.contact_email ??
                    patient?.email ??
                    "Fara date contact";
                  const email = appointment.contact_email ?? patient?.email ?? null;

                  return (
                    <tr
                      className={`group transition-colors duration-200 hover:bg-[#f5f4ed]/70${
                        appointment.status === "cancelled" ? " opacity-70" : ""
                      }`}
                      key={appointment.id}
                    >
                      <td className="px-6 py-4 align-middle">
                        <Link
                          className="flex items-center gap-3"
                          href={`/admin/appointments/${appointment.id}`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd]/65 font-serif text-lg font-semibold text-[#654d35]">
                            {getInitials(patientName)}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block font-bold text-[#31332c]${
                                appointment.status === "cancelled"
                                  ? " line-through decoration-[#b1b3a9]"
                                  : ""
                              }`}
                            >
                              {patientName}
                            </span>
                            <span className="block truncate text-xs font-semibold text-[#5e6058]">
                              {patientContact}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="font-bold text-[#31332c]">
                          {formatAppointmentDate(appointment.start_at)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[#5e6058]">
                          {formatAppointmentTimeRange(
                            appointment.start_at,
                            appointment.end_at,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="font-bold text-[#31332c]">
                          {service?.name ?? "Programare"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[#5e6058]">
                          {appointment.is_first_visit ? "Prima vizita" : "Revenire"}{" - "}
                          {formatSourceLabel(appointment.source)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="inline-flex items-center gap-2 font-semibold text-[#31332c]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e2e1] text-[#5f5e5e]">
                            <Stethoscope className="h-3.5 w-3.5" />
                          </span>
                          Dr. Camelia
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(
                            appointment.status,
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusDotClass(
                              appointment.status,
                            )}`}
                          />
                          {formatStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efeee6] px-3 py-1 text-xs font-bold text-[#5e6058]">
                          {appointment.intake_status === "submitted" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : null}
                          {formatIntakeLabel(appointment.intake_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex rounded-full bg-[#f5f4ed] px-3 py-1 text-xs font-bold text-[#5e6058]">
                          {formatSyncLabel(appointment.sync_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                          {email ? (
                            <a
                              className="rounded-full p-2 text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                              href={`mailto:${email}`}
                              title="Trimite email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          ) : null}
                          {appointment.intake_document_id ? (
                            <Link
                              className="rounded-full p-2 text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                              href={`/admin/appointments/${appointment.id}/document`}
                              title="Vezi evaluarea"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                          ) : null}
                          <Link
                            className="rounded-full p-2 text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                            href={`/admin/appointments/${appointment.id}`}
                            title="Detalii programare"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-14 text-center" colSpan={8}>
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
                        <UsersRound className="h-5 w-5" />
                      </span>
                      <h2 className="mt-4 font-serif text-2xl text-[#31332c]">
                        Nu am gasit programari
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#5e6058]">
                        Ajusteaza filtrele sau reseteaza cautarea pentru a vedea toate
                        programarile disponibile.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#b1b3a9]/10 bg-[#fbf9f4]/55 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-[#5e6058]">
            Afisare {visibleFrom}-{visibleTo} din {totalCount} programari
          </span>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#797c73] transition hover:bg-[#efeee6] hover:text-[#31332c]"
                href={previousHref}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#b1b3a9]">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#31332c]">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#797c73] transition hover:bg-[#efeee6] hover:text-[#31332c]"
                href={nextHref}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#b1b3a9]">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-36 items-center gap-3 rounded-2xl border border-[#b1b3a9]/15 bg-white px-4 py-3 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
        {icon}
      </span>
      <span>
        <span className="block font-serif text-2xl leading-none text-[#31332c]">
          {value}
        </span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5e6058]">
          {label}
        </span>
      </span>
    </div>
  );
}

function TableHead({
  align = "left",
  children,
}: {
  align?: "left" | "right";
  children: ReactNode;
}) {
  const alignmentClass = align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`px-6 py-5 ${alignmentClass} text-[11px] font-bold uppercase tracking-[0.14em] text-[#5e6058]`}
    >
      {children}
    </th>
  );
}

