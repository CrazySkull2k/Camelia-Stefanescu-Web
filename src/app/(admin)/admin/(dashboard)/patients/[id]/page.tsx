import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  Mail,
  Phone,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/dates";
import { requireOwnerAdminAal2User } from "@/modules/auth/guards";
import {
  getPatientQuestionnaireStatus,
  type PatientQuestionnaireState,
} from "@/modules/forms/questionnaire";

type PatientPageProps = {
  params: Promise<{ id: string }>;
};

type Relation<T> = T | T[] | null | undefined;

type PatientRecord = {
  auth_user_id: string | null;
  birth_date: string | null;
  created_at: string;
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
  sex: string | null;
  updated_at: string | null;
};

type AppointmentRecord = {
  end_at: string;
  id: string;
  intake_document_id: string | null;
  intake_status: string;
  service_offerings: Relation<{
    duration_minutes?: number | null;
    name?: string | null;
  }>;
  start_at: string;
  status: string;
  sync_status: string;
};

type FormSubmissionRecord = {
  appointment_id: string | null;
  definition_id: string;
  generated_documents: Relation<{ id?: string | null }>;
  id: string;
  status: string;
  submitted_at: string;
};

type GeneratedDocumentRecord = {
  appointment_id: string | null;
  created_at: string;
  document_type: string;
  id: string;
  submission_id: string | null;
};

type AnalysisUploadRecord = {
  category_label: string;
  created_at: string;
  file_size: number | null;
  id: string;
  original_filename: string;
};

const dateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ro-RO", {
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

function asDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(value?: string | null, fallback = "N/A") {
  const date = value?.includes("T") ? asDate(value) : asDate(`${value}T00:00:00`);
  return date ? dateFormatter.format(date).replace(".", "") : fallback;
}

function formatTimeRange(startAt: string, endAt: string) {
  const start = asDate(startAt);
  const end = asDate(endAt);

  if (!start || !end) {
    return "Ora indisponibila";
  }

  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

function formatFileSize(value?: number | null) {
  if (!value || value <= 0) {
    return "Dimensiune necunoscuta";
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function calculateAge(value?: string | null) {
  const birthDate = asDate(value ? `${value}T00:00:00` : null);
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function formatSex(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  if (value === "F") {
    return "Feminin";
  }

  if (value === "M") {
    return "Masculin";
  }

  return value;
}

function formatAppointmentStatus(value: string) {
  if (value === "pending") return "In asteptare";
  if (value === "confirmed") return "Confirmata";
  if (value === "cancelled") return "Anulata";
  if (value === "completed") return "Finalizata";
  return value;
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

function formatFormStatus(value: string) {
  if (value === "submitted") return "Trimis";
  if (value === "draft") return "Ciorna";
  if (value === "reviewed") return "Revizuit";
  return value;
}

function formatQuestionnaireState(value: PatientQuestionnaireState) {
  if (value === "completed") return "Completat";
  if (value === "outdated") return "Necesita actualizare";
  return "Lipsa";
}

function questionnaireStateClass(value: PatientQuestionnaireState) {
  if (value === "completed") {
    return "bg-[#f9f3ea] text-[#5f5b55]";
  }

  if (value === "outdated") {
    return "bg-[#ffdcbd] text-[#654d35]";
  }

  return "bg-[#e2e3d9] text-[#5e6058]";
}

export default async function PatientDetailPage({ params }: PatientPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminAal2User();

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [
    patientResult,
    appointmentsResult,
    formsResult,
    documentsResult,
    analysesResult,
    questionnaireStatus,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, email, phone, birth_date, sex, auth_user_id, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("appointments")
      .select(
        "id, status, start_at, end_at, sync_status, intake_status, intake_document_id, service_offerings(name, duration_minutes)",
        { count: "exact" },
      )
      .eq("patient_id", id)
      .order("start_at", { ascending: false })
      .limit(12),
    supabase
      .from("form_submissions")
      .select("id, definition_id, status, submitted_at, appointment_id, generated_documents(id)", {
        count: "exact",
      })
      .eq("patient_id", id)
      .order("submitted_at", { ascending: false })
      .limit(6),
    supabase
      .from("generated_documents")
      .select(
        "id, submission_id, appointment_id, document_type, created_at",
        { count: "exact" },
      )
      .eq("patient_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("patient_analysis_uploads")
      .select(
        "id, category_label, original_filename, file_size, created_at",
        { count: "exact" },
      )
      .eq("patient_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    getPatientQuestionnaireStatus(id),
  ]);

  const patient = patientResult.data as PatientRecord | null;

  if (!patient) {
    notFound();
  }

  const appointments = (appointmentsResult.data ?? []) as AppointmentRecord[];
  const forms = (formsResult.data ?? []) as FormSubmissionRecord[];
  const documents = (documentsResult.data ?? []) as GeneratedDocumentRecord[];
  const analyses = (analysesResult.data ?? []) as AnalysisUploadRecord[];
  const now = new Date();
  const sortedAppointments = [...appointments].sort(
    (left, right) => asDate(left.start_at)!.getTime() - asDate(right.start_at)!.getTime(),
  );
  const nextAppointment =
    sortedAppointments.find(
      (appointment) =>
        appointment.status !== "cancelled" &&
        (asDate(appointment.start_at)?.getTime() ?? 0) >= now.getTime(),
    ) ?? null;
  const lastAppointment =
    [...appointments].find(
      (appointment) =>
        appointment.status !== "cancelled" &&
        (asDate(appointment.start_at)?.getTime() ?? Number.POSITIVE_INFINITY) < now.getTime(),
    ) ?? null;
  const age = calculateAge(patient.birth_date);
  const updatedAt = patient.updated_at ?? patient.created_at;
  const patientDocumentHref = (documentId: string) =>
    `/admin/patients/${patient.id}/document/${documentId}`;
  const patientAnalysisHref = (analysisId: string) =>
    `/admin/patients/${patient.id}/analysis/${analysisId}`;

  return (
    <main className="space-y-10 pb-12">
      <section>
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="group mb-6 inline-flex w-fit items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5f5e5e] transition hover:text-[#31332c]"
              href="/admin/patients"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Inapoi la pacienti
            </Link>
            <h1 className="font-serif text-6xl italic leading-none tracking-[-0.045em] text-[#31332c] md:text-7xl">
              {patient.full_name}
            </h1>
            <p className="mt-4 text-sm font-semibold tracking-wide text-[#797c73]">
              Profil actualizat: {formatDateTime(updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {patient.email ? (
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-5 text-sm font-bold text-[#faf7f6] shadow-[0px_12px_28px_rgba(95,94,94,0.18)] transition hover:bg-[#535252]"
                href={`mailto:${patient.email}`}
              >
                <Mail className="h-4 w-4" />
                Email pacient
              </a>
            ) : null}
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#e2e3d9] px-5 text-sm font-bold text-[#31332c] transition hover:bg-[#d9dbcf]"
              href={`/admin/appointments?q=${encodeURIComponent(
                patient.email ?? patient.phone ?? patient.full_name,
              )}`}
            >
              Vezi programari
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-5 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] md:grid-cols-2 xl:grid-cols-4">
          <ProfileFact icon={<Mail className="h-4 w-4" />} label="Email" value={patient.email ?? "N/A"} />
          <ProfileFact icon={<Phone className="h-4 w-4" />} label="Telefon" value={patient.phone ?? "N/A"} />
          <ProfileFact
            icon={<CalendarDays className="h-4 w-4" />}
            label="Data nasterii"
            value={
              patient.birth_date
                ? `${formatDisplayDate(patient.birth_date)}${age !== null ? ` (${age} ani)` : ""}`
                : "N/A"
            }
          />
          <ProfileFact icon={<UserRound className="h-4 w-4" />} label="Sex" value={formatSex(patient.sex)} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Programari totale"
          value={appointmentsResult.count ?? appointments.length}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Urmatoarea"
          value={nextAppointment ? formatDisplayDate(nextAppointment.start_at) : "N/A"}
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Evaluare nutritionala"
          value={formatQuestionnaireState(questionnaireStatus.state)}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Cont pacient"
          value={patient.auth_user_id ? "Conectat" : "Fara cont"}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-3">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] xl:col-span-2">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-4xl leading-none tracking-[-0.035em] text-[#31332c]">
                Programari
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#797c73]">
                Ultimele interactiuni din calendarul pacientului.
              </p>
            </div>
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f4ed] text-[#5f5e5e] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
              href={`/admin/appointments?q=${encodeURIComponent(
                patient.email ?? patient.phone ?? patient.full_name,
              )}`}
              title="Vezi toate programarile"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            {appointments.length ? (
              appointments.map((appointment) => {
                const service = unwrapRelation(appointment.service_offerings);

                return (
                  <Link
                    className="group flex flex-col gap-4 rounded-2xl bg-[#fbf9f4] p-5 transition hover:bg-[#f5f4ed] md:flex-row md:items-center md:justify-between"
                    href={`/admin/appointments/${appointment.id}`}
                    key={appointment.id}
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-bold text-[#31332c]">
                          {service?.name ?? "Programare"}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-[#797c73]">
                          {formatDisplayDate(appointment.start_at)} ·{" "}
                          {formatTimeRange(appointment.start_at, appointment.end_at)}
                        </span>
                      </span>
                    </span>

                    <span className="flex items-center gap-3 md:justify-end">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${appointmentStatusClass(
                          appointment.status,
                        )}`}
                      >
                        {formatAppointmentStatus(appointment.status)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#797c73] opacity-100 transition group-hover:translate-x-1 group-hover:text-[#31332c] md:opacity-0 md:group-hover:opacity-100" />
                    </span>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                text="Nu exista programari pentru acest pacient."
              />
            )}
          </div>
        </section>

        <div className="grid gap-8">
          <section
            className="scroll-mt-24 rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]"
            id="evaluare-nutritionala"
          >
            <CardHeader
              icon={<ClipboardList className="h-5 w-5" />}
              meta={`${formsResult.count ?? forms.length} total`}
              title="Evaluari nutritionale"
            />
            <div className="mt-6">
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${questionnaireStateClass(
                  questionnaireStatus.state,
                )}`}
              >
                {formatQuestionnaireState(questionnaireStatus.state)}
              </span>
              {questionnaireStatus.completedAt ? (
                <p className="mt-3 text-sm font-semibold text-[#797c73]">
                  Ultima completare: {formatDateTime(questionnaireStatus.completedAt)}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3">
              {forms.length ? (
                forms.slice(0, 3).map((submission) => (
                  <Link
                    className="rounded-2xl bg-[#fbf9f4] px-4 py-3 transition hover:bg-[#f5f4ed]"
                    href={`/admin/forms/${submission.id}`}
                    key={submission.id}
                  >
                    <span className="block text-sm font-bold text-[#31332c]">
                      {submission.definition_id}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#797c73]">
                      {formatFormStatus(submission.status)} ·{" "}
                      {formatDateTime(submission.submitted_at)}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState
                  icon={<ClipboardList className="h-8 w-8" />}
                  text="Nu exista evaluari nutritionale."
                />
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <CardHeader
              icon={<FileText className="h-5 w-5" />}
              meta={`${documentsResult.count ?? documents.length} total`}
              title="Documente"
            />
            <div className="mt-5 grid gap-3">
              {documents.length ? (
                documents.slice(0, 4).map((document) => {
                  const content = (
                    <>
                      <span className="block text-sm font-bold text-[#31332c]">
                        {document.document_type}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-[#797c73]">
                        {formatDateTime(document.created_at)}
                      </span>
                    </>
                  );

                  return (
                    <a
                      className="rounded-2xl bg-[#fbf9f4] px-4 py-3 transition hover:bg-[#f5f4ed]"
                      href={patientDocumentHref(document.id)}
                      key={document.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {content}
                    </a>
                  );
                })
              ) : (
                <EmptyState icon={<FileText className="h-8 w-8" />} text="Nu exista documente." />
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-3">
        <section
          className="scroll-mt-24 rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] xl:col-span-2"
          id="analize"
        >
          <CardHeader
            icon={<UploadCloud className="h-5 w-5" />}
            meta={`${analysesResult.count ?? analyses.length} total`}
            title="Analize incarcate"
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {analyses.length ? (
              analyses.map((analysis) => {
                const content = (
                  <>
                    <span className="block text-sm font-bold text-[#31332c]">
                      {analysis.category_label}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-[#797c73]">
                      {analysis.original_filename}
                    </span>
                    <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#797c73]">
                      {formatFileSize(analysis.file_size)} · {formatDateTime(analysis.created_at)}
                    </span>
                  </>
                );

                return (
                  <a
                    className="rounded-2xl bg-[#fbf9f4] px-4 py-3 transition hover:bg-[#f5f4ed]"
                    href={patientAnalysisHref(analysis.id)}
                    key={analysis.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {content}
                  </a>
                );
              })
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  icon={<UploadCloud className="h-8 w-8" />}
                  text="Nu exista analize incarcate pentru pacient."
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#31332c] p-6 text-[#faf7f6] shadow-[0px_12px_32px_rgba(49,51,44,0.08)]">
          <CardHeader
            dark
            icon={<FolderOpen className="h-5 w-5" />}
            meta="Context rapid"
            title="Rezumat clinic"
          />
          <div className="mt-6 grid gap-4">
            <DarkFact label="Ultima vizita" value={lastAppointment ? formatDisplayDate(lastAppointment.start_at) : "N/A"} />
            <DarkFact label="Urmatoarea programare" value={nextAppointment ? formatDisplayDate(nextAppointment.start_at) : "N/A"} />
            <DarkFact label="Creat in sistem" value={formatDateTime(patient.created_at)} />
            <DarkFact label="Cont pacient" value={patient.auth_user_id ? "Activ" : "Neconectat"} />
          </div>
        </section>
      </section>
    </main>
  );
}

function ProfileFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.35rem] bg-[#fbf9f4] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#797c73]">
          {label}
        </span>
        <span className="mt-1 block truncate text-sm font-bold text-[#31332c]">{value}</span>
      </span>
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
  value: number | string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f4ed] text-[#5f5e5e]">
        {icon}
      </span>
      <p className="mt-5 font-serif text-3xl leading-none text-[#31332c]">{value}</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#797c73]">
        {label}
      </p>
    </div>
  );
}

function CardHeader({
  dark = false,
  icon,
  meta,
  title,
}: {
  dark?: boolean;
  icon: ReactNode;
  meta: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2
          className={`font-serif text-3xl leading-none tracking-[-0.03em] ${
            dark ? "text-[#faf7f6]" : "text-[#31332c]"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
            dark ? "text-[#faf7f6]/55" : "text-[#797c73]"
          }`}
        >
          {meta}
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          dark ? "bg-[#faf7f6]/10 text-[#ffdcbd]" : "bg-[#ffdcbd] text-[#654d35]"
        }`}
      >
        {icon}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[#fbf9f4] p-6 text-center">
      <span className="text-[#b1b3a9]">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-[#5e6058]">{text}</p>
    </div>
  );
}

function DarkFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#faf7f6]/55">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-[#faf7f6]">{value}</p>
    </div>
  );
}
