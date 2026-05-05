"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FilterX,
  FolderOpen,
  List,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { AppointmentFilterSelect } from "@/components/admin/appointment-filter-fields";

export type PatientRegistryStatus = "active" | "attention" | "quiet" | "waiting";

export type PatientRegistryViewMode = "folder" | "list";

export type PatientRegistryFilters = {
  q: string;
  sort: string;
  status: string;
};

export type PatientRegistryOption = {
  label: string;
  value: string;
};

export type PatientRegistryItem = {
  appointmentsCount: number;
  createdLabel: string;
  documentsCount: number;
  email: string | null;
  fullName: string;
  hasPatientAccount: boolean;
  id: string;
  latestAppointmentLabel: string | null;
  phone: string | null;
  profileHref: string;
  status: PatientRegistryStatus;
  statusReason: string;
};

const VIEW_STORAGE_KEY = "camelia_patient_registry_view";
const VIEW_CHANGE_EVENT = "camelia_patient_registry_view_change";

function getStoredView(value: string | null): PatientRegistryViewMode {
  return value === "list" || value === "folder" ? value : "folder";
}

function getRegistryViewSnapshot() {
  if (typeof window === "undefined") {
    return "folder" satisfies PatientRegistryViewMode;
  }

  return getStoredView(window.localStorage.getItem(VIEW_STORAGE_KEY));
}

function subscribeToRegistryView(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(VIEW_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(VIEW_CHANGE_EVENT, onStoreChange);
  };
}

export function PatientRegistryView({
  filters,
  hasActiveFilters,
  patients,
  sortOptions,
  statusOptions,
}: {
  filters: PatientRegistryFilters;
  hasActiveFilters: boolean;
  patients: PatientRegistryItem[];
  sortOptions: PatientRegistryOption[];
  statusOptions: PatientRegistryOption[];
}) {
  const view = useSyncExternalStore(
    subscribeToRegistryView,
    getRegistryViewSnapshot,
    () => "folder",
  );

  function handleViewChange(nextView: PatientRegistryViewMode) {
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    window.dispatchEvent(new Event(VIEW_CHANGE_EVENT));
  }

  return (
    <>
      <form
        className="relative z-20 flex flex-col gap-4 rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-4 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] lg:flex-row lg:items-center"
        method="get"
      >
        <label className="relative w-full lg:w-96">
          <span className="sr-only">Cauta pacient</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#797c73]" />
          <input
            className="w-full rounded-full border-0 bg-[#efeee6] py-3 pl-11 pr-4 text-sm font-semibold text-[#31332c] outline-none ring-0 transition placeholder:text-[#5e6058]/65 focus:bg-white focus:ring-1 focus:ring-[#5f5e5e]/30"
            defaultValue={filters.q}
            name="q"
            placeholder="Cauta pacient, email sau telefon..."
            type="search"
          />
        </label>

        <div className="hidden h-8 w-px bg-[#b1b3a9]/20 lg:block" />

        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:justify-end">
          <div className="lg:w-52">
            <AppointmentFilterSelect
              defaultValue={filters.status}
              key={`status-${filters.status}`}
              label="Status pacient"
              name="status"
              options={statusOptions}
              placeholder="Status (toate)"
            />
          </div>
          <div className="lg:w-56">
            <AppointmentFilterSelect
              allowEmpty={false}
              defaultValue={filters.sort}
              key={`sort-${filters.sort}`}
              label="Sorteaza pacientii"
              name="sort"
              options={sortOptions}
              placeholder="Sorteaza"
            />
          </div>
          <div className="inline-flex min-h-11 rounded-full bg-[#efeee6] p-1 lg:w-44">
            <ViewToggleButton
              active={view === "folder"}
              icon={<FolderOpen className="h-4 w-4" />}
              label="Folder"
              onClick={() => handleViewChange("folder")}
            />
            <ViewToggleButton
              active={view === "list"}
              icon={<List className="h-4 w-4" />}
              label="Lista"
              onClick={() => handleViewChange("list")}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#5f5e5e] px-5 text-sm font-bold text-[#faf7f6] transition hover:bg-[#535252]"
            type="submit"
          >
            Aplica
          </button>
          {hasActiveFilters ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-4 text-sm font-bold text-[#5e6058] transition hover:bg-[#e8e9e0] hover:text-[#31332c]"
              href="/admin/patients"
            >
              <FilterX className="h-4 w-4" />
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {patients.length ? (
        view === "list" ? (
          <section className="grid gap-4">
            {patients.map((patient) => (
              <PatientListRow key={patient.id} patient={patient} />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 items-stretch gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
            {patients.map((patient) => (
              <PatientFolderCard key={patient.id} patient={patient} />
            ))}
          </section>
        )
      ) : (
        <section className="rounded-[2rem] bg-white p-10 text-center shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
            <FolderOpen className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-serif text-3xl text-[#31332c]">Nu am gasit pacienti</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-[#5e6058]">
            Ajusteaza cautarea sau reseteaza filtrele pentru a vedea registrul complet.
          </p>
        </section>
      )}
    </>
  );
}

function ViewToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-bold transition ${
        active
          ? "bg-white text-[#31332c] shadow-[0px_8px_20px_rgba(49,51,44,0.08)]"
          : "text-[#5e6058] hover:text-[#31332c]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function PatientFolderCard({ patient }: { patient: PatientRegistryItem }) {
  const status = getStatusPresentation(patient.status);

  return (
    <Link
      className="group flex h-full min-h-[23rem] flex-col transition-transform duration-300 hover:-translate-y-1"
      href={patient.profileHref}
    >
      <div className="relative z-0 -mb-px flex h-7 w-32 items-center rounded-t-xl border-x border-t border-[#b1b3a9]/10 bg-white px-3 shadow-[0_-2px_10px_rgba(49,51,44,0.02)]">
        <FolderOpen className={`h-4 w-4 ${status.tabClass}`} />
      </div>
      <article className="relative z-10 flex flex-1 flex-col justify-between rounded-b-2xl rounded-tr-2xl border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div className={`absolute left-0 top-0 h-1 w-full rounded-tr-2xl ${status.stripeClass}`} />
        <div>
          <div className="mb-4 flex justify-end">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${status.badgeClass}`}>
              {status.label}
            </span>
          </div>
          <h2 className="break-words font-serif text-3xl font-semibold leading-tight text-[#31332c]">
            {patient.fullName}
          </h2>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#5e6058]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Creat: {patient.createdLabel}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <CardMetric
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Prog."
              value={patient.appointmentsCount}
            />
            <CardMetric
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              label="Docs"
              value={patient.documentsCount}
            />
            <CardMetric
              icon={
                patient.hasPatientAccount ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )
              }
              label="Cont"
              value={patient.hasPatientAccount ? "Da" : "Nu"}
            />
          </div>
          <p className="mt-4 break-words text-xs font-bold uppercase leading-5 tracking-[0.12em] text-[#797c73]">
            {patient.latestAppointmentLabel ?? patient.statusReason}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <span className="flex max-w-full items-start gap-2 break-all text-xs font-semibold leading-5 text-[#5e6058]">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              {patient.email ?? "Email lipsa"}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold leading-5 text-[#5e6058]">
              <Phone className="h-4 w-4 shrink-0" />
              {patient.phone ?? "Telefon lipsa"}
            </span>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5f5e5e] text-[#faf7f6] transition duration-200 group-hover:scale-110 group-hover:bg-[#535252]">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function PatientListRow({ patient }: { patient: PatientRegistryItem }) {
  const status = getStatusPresentation(patient.status);

  return (
    <Link
      className="group rounded-[1.5rem] border border-[#b1b3a9]/10 bg-white p-4 shadow-[0px_12px_32px_rgba(49,51,44,0.04)] transition hover:-translate-y-0.5 hover:bg-[#fbf9f4]"
      href={patient.profileHref}
    >
      <article className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status.iconClass}`}>
            <FolderOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words font-serif text-2xl font-semibold leading-tight text-[#31332c]">
                {patient.fullName}
              </h2>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${status.badgeClass}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#797c73]">
              Creat: {patient.createdLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-[#5e6058]">
          <span className="flex items-start gap-2 break-all">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#735a42]" />
            {patient.email ?? "Email lipsa"}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-[#735a42]" />
            {patient.phone ?? "Telefon lipsa"}
          </span>
        </div>

        <div>
          <p className="break-words text-sm font-bold leading-6 text-[#31332c]">
            {patient.latestAppointmentLabel ?? patient.statusReason}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CompactMetric label="Prog." value={patient.appointmentsCount} />
            <CompactMetric label="Docs" value={patient.documentsCount} />
            <CompactMetric label="Cont" value={patient.hasPatientAccount ? "Da" : "Nu"} />
          </div>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f5e5e] text-[#faf7f6] transition group-hover:translate-x-1 group-hover:bg-[#535252] lg:justify-self-end">
          <ArrowRight className="h-4 w-4" />
        </span>
      </article>
    </Link>
  );
}

function getStatusPresentation(status: PatientRegistryStatus) {
  if (status === "active") {
    return {
      badgeClass: "bg-[#f9f3ea] text-[#5f5b55]",
      iconClass: "bg-[#ffdcbd] text-[#654d35]",
      label: "Activ",
      stripeClass: "bg-[#ffdcbd]",
      tabClass: "text-[#735a42]",
    };
  }

  if (status === "waiting") {
    return {
      badgeClass: "bg-[#efeee6] text-[#5e6058]",
      iconClass: "bg-[#efeee6] text-[#5e6058]",
      label: "In asteptare",
      stripeClass: "bg-[#e2e3d9]",
      tabClass: "text-[#797c73]",
    };
  }

  if (status === "attention") {
    return {
      badgeClass: "bg-[#fe8983]/35 text-[#752121]",
      iconClass: "bg-[#fe8983]/30 text-[#752121]",
      label: "Atentie",
      stripeClass: "bg-[#fe8983]",
      tabClass: "text-[#9f403d]",
    };
  }

  return {
    badgeClass: "bg-[#e2e3d9] text-[#5e6058]",
    iconClass: "bg-[#e2e3d9] text-[#5e6058]",
    label: "Fara programari",
    stripeClass: "bg-[#e2e3d9]",
    tabClass: "text-[#797c73]",
  };
}

function CardMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <span className="rounded-2xl bg-[#fbf9f4] px-3 py-2">
      <span className="flex items-center gap-1 text-[#735a42]">{icon}</span>
      <span className="mt-1 block text-sm font-bold text-[#31332c]">{value}</span>
      <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#797c73]">
        {label}
      </span>
    </span>
  );
}

function CompactMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="rounded-full bg-[#efeee6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5e6058]">
      {label}: {value}
    </span>
  );
}
