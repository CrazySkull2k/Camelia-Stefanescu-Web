import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  FlaskConical,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  AppointmentDateFilter,
  AppointmentFilterSelect,
} from "@/components/admin/appointment-filter-fields";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  formatDateInputValue,
  formatDateTime,
  formatTimeInputValue,
} from "@/lib/utils/dates";
import { requireOwnerAdminUser } from "@/modules/auth/guards";
import type {
  AppointmentIntakeStatus,
  AppointmentStatus,
  AppointmentSyncStatus,
} from "@/modules/appointments/types";
import {
  getPatientQuestionnaireStatus,
  type PatientQuestionnaireState,
} from "@/modules/forms/questionnaire";

type AppointmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

type Relation<T> = T | T[] | null | undefined;

type AppointmentDetailRecord = {
  id: string;
  patient_id: string | null;
  status: AppointmentStatus;
  intake_status: AppointmentIntakeStatus;
  intake_submitted_at: string | null;
  intake_document_id: string | null;
  public_reference_code_hint: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sync_status: AppointmentSyncStatus;
  sync_error: string | null;
  start_at: string;
  end_at: string;
  admin_notes: string | null;
  patient_notes: string | null;
  requested_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  last_synced_at: string | null;
  source: string | null;
  is_first_visit: boolean;
  patients: Relation<{
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  }>;
  service_offerings: Relation<{
    duration_minutes?: number | null;
    name?: string | null;
  }>;
};

const FORM_ID = "appointment-management-form";

const statusOptions: Array<{ label: string; value: AppointmentStatus }> = [
  { label: "In asteptare", value: "pending" },
  { label: "Confirmata", value: "confirmed" },
  { label: "Anulata", value: "cancelled" },
  { label: "Finalizata", value: "completed" },
];

const appointmentDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

const appointmentTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

function unwrapRelation<T>(value: Relation<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function asDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAppointmentDate(value: string) {
  const date = asDate(value);
  return date ? appointmentDateFormatter.format(date).replace(".", "") : "Data indisponibila";
}

function formatAppointmentTime(value: string) {
  const date = asDate(value);
  return date ? appointmentTimeFormatter.format(date) : "--:--";
}

function formatAppointmentTimeRange(startAt: string, endAt: string) {
  return `${formatAppointmentTime(startAt)} - ${formatAppointmentTime(endAt)}`;
}

function formatDuration(startAt: string, endAt: string, fallback?: number | null) {
  const start = asDate(startAt);
  const end = asDate(endAt);

  if (start && end) {
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    if (minutes > 0) {
      return `${minutes} min`;
    }
  }

  return fallback ? `${fallback} min` : "Durata nespecificata";
}

function formatStatusLabel(value: string) {
  if (value === "pending") return "In asteptare";
  if (value === "confirmed") return "Confirmata";
  if (value === "cancelled") return "Anulata";
  if (value === "completed") return "Finalizata";
  return value;
}

function formatQuestionnaireLabel(value?: PatientQuestionnaireState | null) {
  if (value === "completed") return "Completata";
  if (value === "outdated") return "Necesita actualizare";
  if (value === "missing") return "Necompletata";
  return "Necompletata";
}

function formatSourceLabel(value?: string | null) {
  if (value === "patient_account") return "Cont pacient";
  if (value === "admin_panel") return "Admin";
  if (value === "public_site") return "Site public";
  return "Sursa necunoscuta";
}

function formatPhoneHref(value?: string | null) {
  const normalized = value?.replace(/[^\d+]/g, "") ?? "";
  return normalized ? `tel:${normalized}` : null;
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

function questionnaireBadgeClass(status?: PatientQuestionnaireState | null) {
  if (status === "completed") {
    return "bg-[#f9f3ea] text-[#5f5b55]";
  }

  if (status === "outdated") {
    return "bg-[#ffdcbd] text-[#654d35]";
  }

  return "bg-[#e2e3d9] text-[#5e6058]";
}

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: AppointmentDetailPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminUser();

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, status, intake_status, intake_submitted_at, intake_document_id, public_reference_code_hint, contact_name, contact_email, contact_phone, sync_status, sync_error, start_at, end_at, admin_notes, patient_notes, requested_at, confirmed_at, cancelled_at, completed_at, last_synced_at, source, is_first_visit, patients(full_name, email, phone), service_offerings(name, duration_minutes)",
    )
    .eq("id", id)
    .single();

  const appointment = data as AppointmentDetailRecord | null;

  if (!appointment) {
    notFound();
  }

  const analysesResult = appointment.patient_id
    ? await supabase
        .from("patient_analysis_uploads")
        .select("id", { count: "exact" })
        .eq("patient_id", appointment.patient_id)
        .limit(1)
    : null;
  const questionnaireStatus = appointment.patient_id
    ? await getPatientQuestionnaireStatus(appointment.patient_id)
    : null;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const patient = unwrapRelation(appointment.patients);
  const service = unwrapRelation(appointment.service_offerings);
  const patientName = appointment.contact_name ?? patient?.full_name ?? "Pacient";
  const patientEmail = appointment.contact_email ?? patient?.email ?? null;
  const patientPhone = appointment.contact_phone ?? patient?.phone ?? null;
  const patientPhoneHref = formatPhoneHref(patientPhone);
  const patientProfileHref = appointment.patient_id
    ? `/admin/patients/${appointment.patient_id}`
    : null;
  const patientEvaluationHref = appointment.intake_document_id
    ? `/admin/appointments/${id}/document`
    : questionnaireStatus?.latestSubmissionId
      ? `/admin/forms/${questionnaireStatus.latestSubmissionId}`
      : appointment.patient_id
        ? `/admin/patients/${appointment.patient_id}#evaluare-nutritionala`
        : null;
  const patientAnalysesHref = appointment.patient_id
    ? `/admin/patients/${appointment.patient_id}#analize`
    : null;
  const analysesCount = analysesResult?.count ?? 0;
  const serviceName = service?.name ?? "Programare";
  const startDateLabel = formatAppointmentDate(appointment.start_at);
  const timeRangeLabel = formatAppointmentTimeRange(appointment.start_at, appointment.end_at);
  const durationLabel = formatDuration(
    appointment.start_at,
    appointment.end_at,
    service?.duration_minutes,
  );

  return (
    <main className="mx-auto w-full max-w-5xl pb-12">
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link
          className="group inline-flex w-fit items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5f5e5e] transition hover:text-[#31332c]"
          href="/admin/appointments"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Inapoi la programari
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f5f4ed] px-5 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
            href="/admin/appointments"
          >
            Anuleaza editarea
          </Link>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-5 text-sm font-bold text-[#faf7f6] shadow-[0px_12px_28px_rgba(95,94,94,0.18)] transition hover:bg-[#535252]"
            form={FORM_ID}
            type="submit"
          >
            <Save className="h-4 w-4" />
            Salveaza modificarile
          </button>
        </div>
      </div>

      <article className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:p-10 xl:p-14">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-bl-[100%] bg-[#efeee6]/70" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#ffdcbd]/20 blur-3xl" />

        {error ? (
          <div className="relative z-10 mb-8 rounded-[1.25rem] border border-[#fe8983]/45 bg-[#fff7f6] px-5 py-4 text-sm font-semibold text-[#752121]">
            {error}
          </div>
        ) : null}
        {!error && status ? (
          <div className="relative z-10 mb-8 rounded-[1.25rem] border border-[#ffdcbd]/60 bg-[#fff7f3] px-5 py-4 text-sm font-semibold text-[#654d35]">
            {status === "updated"
              ? "Programarea a fost actualizata."
              : status === "sync-retried"
                ? "Sincronizarea a fost repornita."
                : "Modificarile au fost procesate."}
          </div>
        ) : null}

        <header className="relative z-10 flex flex-col gap-8 border-b border-[#b1b3a9]/15 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
              <CalendarCheck className="h-4 w-4" />
              Detalii programare
            </span>
            <h1 className="mt-4 font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c] md:text-6xl">
              {patientName}
            </h1>
            <p className="mt-4 text-lg font-semibold text-[#5e6058]">{serviceName}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {patientProfileHref ? (
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#31332c] px-4 text-sm font-bold text-[#faf7f6] transition hover:bg-[#5f5e5e]"
                  href={patientProfileHref}
                >
                  <UserRound className="h-4 w-4" />
                  Profil client
                </Link>
              ) : null}
              {patientEmail ? (
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                  href={`mailto:${patientEmail}`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              ) : null}
              {patientPhoneHref ? (
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                  href={patientPhoneHref}
                >
                  <Phone className="h-4 w-4" />
                  Telefon
                </a>
              ) : null}
              {appointment.intake_document_id ? (
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                  href={`/admin/appointments/${id}/document`}
                >
                  <FileText className="h-4 w-4" />
                  PDF evaluare
                </Link>
              ) : null}
            </div>
          </div>

          <div className="min-w-[13rem] rounded-2xl bg-[#f5f4ed] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
              Data & ora
            </span>
            <p className="mt-3 font-serif text-3xl leading-none text-[#31332c]">
              {startDateLabel}
            </p>
            <p className="mt-3 text-lg font-semibold text-[#5e6058]">{timeRangeLabel}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#797c73]">
              {durationLabel}
            </p>
          </div>
        </header>

        <section className="relative z-10 mt-10 grid gap-6 rounded-[1.5rem] bg-[#f5f4ed] p-6 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Status">
            <StatusPill
              className={statusBadgeClass(appointment.status)}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              {formatStatusLabel(appointment.status)}
            </StatusPill>
          </SummaryTile>
          <SummaryTile label="Evaluare Nutritionala">
            <ThinSummaryLink href={patientEvaluationHref}>
              <StatusPill
                className={questionnaireBadgeClass(questionnaireStatus?.state)}
                icon={
                  questionnaireStatus?.state === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock3 className="h-4 w-4" />
                  )
                }
              >
                {formatQuestionnaireLabel(questionnaireStatus?.state)}
              </StatusPill>
            </ThinSummaryLink>
          </SummaryTile>
          <SummaryTile label="Analize">
            <ThinSummaryLink href={patientAnalysesHref}>
              <StatusPill
                className={
                  analysesCount > 0
                    ? "bg-[#f9f3ea] text-[#5f5b55]"
                    : "bg-[#e2e3d9] text-[#5e6058]"
                }
                icon={<FlaskConical className="h-4 w-4" />}
              >
                {analysesCount > 0 ? `${analysesCount} incarcate` : "Fara analize"}
              </StatusPill>
            </ThinSummaryLink>
          </SummaryTile>
          <SummaryTile label="Vizita">
            <StatusPill
              className="bg-[#e2e3d9] text-[#5e6058]"
              icon={<UserRound className="h-4 w-4" />}
            >
              {appointment.is_first_visit ? "Prima vizita" : "Revenire"}
            </StatusPill>
          </SummaryTile>
        </section>

        {appointment.sync_error ? (
          <div className="relative z-10 mt-6 rounded-[1.25rem] border border-[#fe8983]/45 bg-[#fff7f6] p-4 text-sm font-semibold leading-6 text-[#752121]">
            <span className="inline-flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Ultima eroare de sincronizare: {appointment.sync_error}
            </span>
          </div>
        ) : null}

        <section className="relative z-10 mt-12">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-3xl leading-none tracking-[-0.03em] text-[#31332c]">
              Gestioneaza programarea
            </h2>
            <div className="h-px flex-1 bg-[#b1b3a9]/15" />
          </div>

          <form
            action={`/api/admin/appointments/${id}`}
            className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2"
            id={FORM_ID}
            method="post"
          >
            <FieldGroup label="Status programare">
              <AppointmentFilterSelect
                allowEmpty={false}
                defaultValue={appointment.status}
                key={`status-${appointment.status}`}
                label="Status programare"
                name="status"
                options={statusOptions}
                placeholder="Status"
              />
            </FieldGroup>

            <FieldGroup label="Tip serviciu">
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-transparent bg-[#efeee6] px-5 py-4 text-base font-semibold text-[#5e6058] outline-none transition focus:border-[#5f5e5e]/30 focus:bg-white"
                  readOnly
                  type="text"
                  value={serviceName}
                />
                <Stethoscope className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#797c73]" />
              </div>
            </FieldGroup>

            <AppointmentDateFilter
              allowClear={false}
              defaultValue={formatDateInputValue(appointment.start_at)}
              key={`date-${appointment.start_at}`}
              label="Data"
              name="date"
            />

            <FieldGroup label="Ora de incepere">
              <div className="relative">
                <input
                  className="w-full cursor-pointer rounded-xl border border-transparent bg-[#efeee6] px-5 py-4 pr-12 text-base font-semibold text-[#31332c] outline-none transition focus:border-[#5f5e5e]/30 focus:bg-white [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  defaultValue={formatTimeInputValue(appointment.start_at)}
                  name="time"
                  required
                  type="time"
                />
                <Clock3 className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#797c73]" />
              </div>
            </FieldGroup>

            <div className="md:col-span-2">
              <label
                className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-[#31332c]"
                htmlFor="admin_notes"
              >
                Note interne
                <span className="text-xs font-semibold text-[#797c73]">
                  Doar vizibil pentru echipa
                </span>
              </label>
              <textarea
                className="min-h-32 w-full resize-none rounded-xl border border-transparent bg-[#efeee6] px-5 py-4 text-base font-semibold leading-7 text-[#31332c] outline-none transition placeholder:text-[#797c73] focus:border-[#5f5e5e]/30 focus:bg-white"
                defaultValue={appointment.admin_notes ?? ""}
                id="admin_notes"
                name="admin_notes"
                placeholder="Adauga observatii clinice sau detalii operationale..."
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-6 text-sm font-bold text-[#faf7f6] shadow-[0px_12px_28px_rgba(95,94,94,0.18)] transition hover:bg-[#535252]"
                type="submit"
              >
                <Save className="h-4 w-4" />
                Salveaza modificarile
              </button>
              {appointment.sync_status !== "synced" ? (
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                  formAction={`/api/admin/appointments/${id}/retry-sync`}
                  formMethod="post"
                  type="submit"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reincearca sincronizarea
                </button>
              ) : null}
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5f4ed] px-5 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
                href="/admin/appointments"
              >
                Inapoi la lista
              </Link>
            </div>
          </form>
        </section>

        <section className="relative z-10 mt-12 grid gap-4 rounded-[1.5rem] border border-[#b1b3a9]/15 bg-[#fbf9f4]/70 p-5 md:grid-cols-2 xl:grid-cols-4">
          <MetaItem
            icon={<UserRound className="h-4 w-4" />}
            label="Vizita"
            value={appointment.is_first_visit ? "Prima vizita" : "Revenire"}
          />
          <MetaItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Sursa"
            value={formatSourceLabel(appointment.source)}
          />
          <MetaItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Cerere trimisa"
            value={appointment.requested_at ? formatDateTime(appointment.requested_at) : "-"}
          />
          <MetaItem
            icon={<RefreshCw className="h-4 w-4" />}
            label="Ultima sincronizare"
            value={appointment.last_synced_at ? formatDateTime(appointment.last_synced_at) : "-"}
          />
        </section>

        {appointment.patient_notes ? (
          <section className="relative z-10 mt-6 rounded-[1.5rem] bg-[#f9f3ea] p-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#654d35]">
              <FileText className="h-4 w-4" />
              Note pacient
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#5e6058]">
              {appointment.patient_notes}
            </p>
          </section>
        ) : null}
      </article>
    </main>
  );
}

function SummaryTile({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
        {label}
      </span>
      <div className="mt-3 flex justify-center">{children}</div>
    </div>
  );
}

function StatusPill({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className: string;
  icon: ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

function ThinSummaryLink({
  children,
  href,
}: {
  children: ReactNode;
  href?: string | null;
}) {
  const className =
    "group grid w-fit gap-2 rounded-2xl transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#735a42]/25";

  if (!href) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function FieldGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-bold text-[#31332c]">{label}</span>
      {children}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd]/70 text-[#654d35]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#797c73]">
          {label}
        </span>
        <span className="mt-1 block truncate text-sm font-bold text-[#31332c]">{value}</span>
      </span>
    </div>
  );
}
