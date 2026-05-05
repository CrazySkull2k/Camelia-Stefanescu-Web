import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import {
  PatientRegistryView,
  type PatientRegistryItem,
} from "@/components/admin/patient-registry-view";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOwnerAdminAal2User } from "@/modules/auth/guards";
import { NUTRITION_QUESTIONNAIRE_DEFINITION_ID } from "@/modules/forms/questionnaire";

type PatientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  intake_status: string;
  patient_id: string;
  service_offerings: Relation<{ name?: string | null }>;
  start_at: string;
  status: string;
  sync_status: string;
};

type PatientFormStatusRecord = {
  completed_at: string | null;
  completed_version_id: string | null;
  latest_submission_id: string | null;
  patient_id: string;
};

type GeneratedDocumentRecord = {
  id: string;
  patient_id: string | null;
};

type PatientRegistryStatus = "active" | "attention" | "quiet" | "waiting";

type PatientCardModel = {
  appointments: AppointmentRecord[];
  documentsCount: number;
  formStatus: PatientFormStatusRecord | null;
  latestAppointment: AppointmentRecord | null;
  patient: PatientRecord;
  status: PatientRegistryStatus;
  statusReason: string;
};

type PatientFilters = {
  page: string;
  q: string;
  sort: string;
  status: string;
};

const PAGE_SIZE = 24;
const MAX_PATIENTS_TO_ENRICH = 500;

const statusOptions: Array<{ label: string; value: PatientRegistryStatus }> = [
  { label: "Activ", value: "active" },
  { label: "In asteptare", value: "waiting" },
  { label: "Atentie", value: "attention" },
  { label: "Fara programari", value: "quiet" },
];

const sortOptions = [
  { label: "Sorteaza: Nou", value: "created_desc" },
  { label: "Recent actualizati", value: "updated_desc" },
  { label: "Nume A-Z", value: "name_asc" },
  { label: "Nume Z-A", value: "name_desc" },
  { label: "Creati vechi", value: "created_asc" },
  { label: "Ultima programare", value: "last_appointment_desc" },
];

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

function sanitizeSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
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

function getFilters(params: Record<string, string | string[] | undefined>) {
  const statusValues = statusOptions.map((option) => option.value);
  const sortValues = sortOptions.map((option) => option.value);
  const rawStatus = getParam(params, "status");
  const rawSort = getParam(params, "sort");

  return {
    page: getParam(params, "page"),
    q: sanitizeSearchTerm(getParam(params, "q")),
    sort: isOneOf(rawSort, sortValues) ? rawSort : "created_desc",
    status: isOneOf(rawStatus, statusValues) ? rawStatus : "",
  } satisfies PatientFilters;
}

function asDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(value?: string | null, fallback = "N/A") {
  const date = asDate(value);
  return date ? dateFormatter.format(date).replace(".", "") : fallback;
}

function formatTime(value?: string | null) {
  const date = asDate(value);
  return date ? timeFormatter.format(date) : "--:--";
}

function toPatientRegistryItem(model: PatientCardModel): PatientRegistryItem {
  const latestService = unwrapRelation(model.latestAppointment?.service_offerings);

  return {
    appointmentsCount: model.appointments.length,
    createdLabel: formatDisplayDate(model.patient.created_at),
    documentsCount: model.documentsCount,
    email: model.patient.email,
    fullName: model.patient.full_name,
    hasPatientAccount: Boolean(model.patient.auth_user_id),
    id: model.patient.id,
    latestAppointmentLabel: model.latestAppointment
      ? `${latestService?.name ?? "Programare"} - ${formatDisplayDate(
          model.latestAppointment.start_at,
        )} ${formatTime(model.latestAppointment.start_at)}`
      : null,
    phone: model.patient.phone,
    profileHref: `/admin/patients/${model.patient.id}`,
    status: model.status,
    statusReason: model.statusReason,
  };
}

function getLatestTimestamp(model: PatientCardModel) {
  return Math.max(
    asDate(model.latestAppointment?.start_at)?.getTime() ?? 0,
    asDate(model.patient.updated_at)?.getTime() ?? 0,
    asDate(model.patient.created_at)?.getTime() ?? 0,
  );
}

function groupAppointments(records: AppointmentRecord[]) {
  const map = new Map<string, AppointmentRecord[]>();

  records.forEach((appointment) => {
    const current = map.get(appointment.patient_id) ?? [];
    current.push(appointment);
    map.set(appointment.patient_id, current);
  });

  return map;
}

function countDocuments(records: GeneratedDocumentRecord[]) {
  const map = new Map<string, number>();

  records.forEach((document) => {
    if (!document.patient_id) {
      return;
    }

    map.set(document.patient_id, (map.get(document.patient_id) ?? 0) + 1);
  });

  return map;
}

function mapFormStatuses(records: PatientFormStatusRecord[]) {
  const map = new Map<string, PatientFormStatusRecord>();

  records.forEach((record) => {
    map.set(record.patient_id, record);
  });

  return map;
}

function getPatientStatus(input: {
  appointments: AppointmentRecord[];
  formStatus: PatientFormStatusRecord | null;
  patient: PatientRecord;
}): { reason: string; status: PatientRegistryStatus } {
  if (
    input.appointments.some(
      (appointment) =>
        appointment.sync_status === "failed" ||
        appointment.sync_status === "needs_retry" ||
        appointment.intake_status === "required_pending",
    )
  ) {
    return {
      reason: "Necesita follow-up",
      status: "attention",
    };
  }

  if (!input.formStatus?.completed_at && input.appointments.length > 0) {
    return {
      reason: "Evaluare lipsa",
      status: "attention",
    };
  }

  if (input.appointments.some((appointment) => appointment.status === "pending")) {
    return {
      reason: "Cerere in asteptare",
      status: "waiting",
    };
  }

  if (input.appointments.length === 0) {
    return {
      reason: input.patient.auth_user_id ? "Cont activ, fara programari" : "Fara programari",
      status: "quiet",
    };
  }

  return {
    reason: input.patient.auth_user_id ? "Cont pacient conectat" : "Activitate clinica",
    status: "active",
  };
}

function getLatestAppointment(appointments: AppointmentRecord[]) {
  return [...appointments].sort(
    (left, right) => (asDate(right.start_at)?.getTime() ?? 0) - (asDate(left.start_at)?.getTime() ?? 0),
  )[0] ?? null;
}

function buildPatientsHref(filters: PatientFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort && filters.sort !== "created_desc") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/patients?${query}` : "/admin/patients";
}

function sortPatients(left: PatientCardModel, right: PatientCardModel, sort: string) {
  if (sort === "name_asc") {
    return left.patient.full_name.localeCompare(right.patient.full_name, "ro");
  }

  if (sort === "name_desc") {
    return right.patient.full_name.localeCompare(left.patient.full_name, "ro");
  }

  if (sort === "created_asc") {
    return (asDate(left.patient.created_at)?.getTime() ?? 0) - (asDate(right.patient.created_at)?.getTime() ?? 0);
  }

  if (sort === "updated_desc") {
    return (
      (asDate(right.patient.updated_at)?.getTime() ?? 0) -
      (asDate(left.patient.updated_at)?.getTime() ?? 0)
    );
  }

  if (sort === "last_appointment_desc") {
    return getLatestTimestamp(right) - getLatestTimestamp(left);
  }

  return (asDate(right.patient.created_at)?.getTime() ?? 0) - (asDate(left.patient.created_at)?.getTime() ?? 0);
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminAal2User();

  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const currentPage = parsePositiveInteger(filters.page);
  const supabase = createSupabaseAdminClient();
  let patientsQuery = supabase
    .from("patients")
    .select("id, full_name, email, phone, birth_date, sex, auth_user_id, created_at, updated_at", {
      count: "exact",
    })
    .limit(MAX_PATIENTS_TO_ENRICH);

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    patientsQuery = patientsQuery.or(
      [`full_name.ilike.${pattern}`, `email.ilike.${pattern}`, `phone.ilike.${pattern}`].join(","),
    );
  }

  if (filters.sort === "name_asc") {
    patientsQuery = patientsQuery.order("full_name", { ascending: true });
  } else if (filters.sort === "name_desc") {
    patientsQuery = patientsQuery.order("full_name", { ascending: false });
  } else if (filters.sort === "created_asc") {
    patientsQuery = patientsQuery.order("created_at", { ascending: true });
  } else if (filters.sort === "updated_desc") {
    patientsQuery = patientsQuery.order("updated_at", { ascending: false, nullsFirst: false });
  } else {
    patientsQuery = patientsQuery.order("created_at", { ascending: false });
  }

  const patientsResult = await patientsQuery;
  const patients = (patientsResult.data ?? []) as PatientRecord[];
  const patientIds = patients.map((patient) => patient.id);
  const [appointmentsResult, formStatusesResult, documentsResult] = patientIds.length
    ? await Promise.all([
        supabase
          .from("appointments")
          .select(
            "id, patient_id, status, sync_status, intake_status, start_at, end_at, service_offerings(name)",
          )
          .in("patient_id", patientIds)
          .order("start_at", { ascending: false }),
        supabase
          .from("patient_form_statuses")
          .select("patient_id, completed_version_id, latest_submission_id, completed_at")
          .eq("definition_id", NUTRITION_QUESTIONNAIRE_DEFINITION_ID)
          .in("patient_id", patientIds),
        supabase
          .from("generated_documents")
          .select("id, patient_id")
          .in("patient_id", patientIds),
      ])
    : [
        { data: [] as AppointmentRecord[] },
        { data: [] as PatientFormStatusRecord[] },
        { data: [] as GeneratedDocumentRecord[] },
      ];
  const appointmentsByPatient = groupAppointments((appointmentsResult.data ?? []) as AppointmentRecord[]);
  const formStatusByPatient = mapFormStatuses(
    (formStatusesResult.data ?? []) as PatientFormStatusRecord[],
  );
  const documentsByPatient = countDocuments((documentsResult.data ?? []) as GeneratedDocumentRecord[]);
  const allPatientCards = patients
    .map((patient) => {
      const appointments = appointmentsByPatient.get(patient.id) ?? [];
      const formStatus = formStatusByPatient.get(patient.id) ?? null;
      const status = getPatientStatus({ appointments, formStatus, patient });

      return {
        appointments,
        documentsCount: documentsByPatient.get(patient.id) ?? 0,
        formStatus,
        latestAppointment: getLatestAppointment(appointments),
        patient,
        status: status.status,
        statusReason: status.reason,
      } satisfies PatientCardModel;
    })
    .sort((left, right) => sortPatients(left, right, filters.sort));
  const enrichedPatients = allPatientCards
    .filter((patient) => (filters.status ? patient.status === filters.status : true))
    .sort((left, right) => sortPatients(left, right, filters.sort));
  const totalCount = enrichedPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = (safePage - 1) * PAGE_SIZE;
  const visiblePatients = enrichedPatients.slice(rangeStart, rangeStart + PAGE_SIZE);
  const visibleFrom = totalCount === 0 ? 0 : rangeStart + 1;
  const visibleTo = Math.min(rangeStart + visiblePatients.length, totalCount);
  const hasActiveFilters = Boolean(filters.q || filters.status || filters.sort !== "created_desc");

  return (
    <main className="space-y-9 pb-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-5xl font-medium leading-none tracking-[-0.04em] text-[#31332c] md:text-6xl">
            Pacienti
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5e6058]">
            Registrul pacientilor, cu cautare rapida, sortare si statusuri derivate din programari,
            evaluari nutritionale si sincronizare.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Afisati" value={totalCount} />
          <MiniStat
            label="Activ"
            value={allPatientCards.filter((patient) => patient.status === "active").length}
          />
          <MiniStat
            label="Asteptare"
            value={allPatientCards.filter((patient) => patient.status === "waiting").length}
          />
          <MiniStat
            label="Atentie"
            value={allPatientCards.filter((patient) => patient.status === "attention").length}
          />
        </div>
      </header>

      {patientsResult.error ? (
        <div className="rounded-[1.5rem] border border-[#fe8983]/50 bg-[#fff7f6] p-4 text-sm font-semibold text-[#752121]">
          Nu am putut incarca pacientii: {patientsResult.error.message}
        </div>
      ) : null}

      <PatientRegistryView
        filters={{
          q: filters.q,
          sort: filters.sort,
          status: filters.status,
        }}
        hasActiveFilters={hasActiveFilters}
        patients={visiblePatients.map(toPatientRegistryItem)}
        sortOptions={sortOptions}
        statusOptions={statusOptions}
      />

      <footer className="flex flex-col gap-4 rounded-[1.5rem] bg-white/70 px-5 py-4 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-[#5e6058]">
          Afisare {visibleFrom}-{visibleTo} din {totalCount} pacienti
        </span>
        <div className="flex items-center gap-2">
          {safePage > 1 ? (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
              href={buildPatientsHref(filters, safePage - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Inapoi
            </Link>
          ) : null}
          <span className="rounded-full bg-[#f5f4ed] px-4 py-2 text-sm font-bold text-[#31332c]">
            {safePage} / {totalPages}
          </span>
          {safePage < totalPages ? (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-4 text-sm font-bold text-[#faf7f6] transition hover:bg-[#535252]"
              href={buildPatientsHref(filters, safePage + 1)}
            >
              Mai multi
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </footer>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[#b1b3a9]/15 bg-white px-4 py-3 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
      <span className="block font-serif text-2xl leading-none text-[#31332c]">{value}</span>
      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5e6058]">
        {label}
      </span>
    </div>
  );
}
