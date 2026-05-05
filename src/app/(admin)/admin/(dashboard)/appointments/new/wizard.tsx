"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

import {
  type AdminAppointmentPatientOption,
  type AdminAppointmentApiResult,
  type AdminAppointmentResult,
} from "./types";

type BookableService = {
  categoryDescription: string;
  categoryKey: string;
  categoryName: string;
  categorySortOrder: number;
  description: string;
  durationMinutes: number;
  id: string;
  priceLabel: string;
  slug: string;
  title: string;
};

type Slot = {
  taken: boolean;
  time: string;
};

type WizardStep = "patient" | "new-patient" | "appointment" | "success";

const weekdayLabels = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const monthLabels = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const dateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "long",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "long",
  timeZone: "Europe/Bucharest",
  year: "numeric",
});

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string | null) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(visibleMonth: Date) {
  const firstDay = startOfMonth(visibleMonth);
  const offset = (firstDay.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return {
      currentMonth: normalized.getMonth() === visibleMonth.getMonth(),
      dayOfMonth: normalized.getDate(),
      value: toDateValue(normalized),
    };
  });
}

function getInitials(name: string) {
  const tokens = name
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "PS";
}

function formatDate(value: string) {
  const date = parseDateValue(value);
  return date ? dateFormatter.format(date) : "Data nealeasa";
}

function getSlotPeriod(time: string) {
  const hour = Number.parseInt(time.split(":")[0] ?? "0", 10);

  if (hour < 12) {
    return "Dimineata";
  }

  if (hour < 17) {
    return "Pranz";
  }

  return "Seara";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponibila" : dateTimeFormatter.format(date);
}

function formatSyncStatus(status: AdminAppointmentResult["syncStatus"]) {
  if (status === "synced") return "Sincronizat";
  if (status === "needs_retry") return "Necesita retry";
  if (status === "failed") return "Eroare calendar";
  return "In asteptare";
}

async function readAdminJsonResult<T>(response: Response): Promise<AdminAppointmentApiResult<T>> {
  try {
    const payload = (await response.json()) as AdminAppointmentApiResult<T>;

    if (!response.ok || !payload.ok) {
      return {
        error:
          !payload.ok && payload.error
            ? payload.error
            : "Nu am primit un raspuns valid de la server.",
        ok: false,
      };
    }

    return payload;
  } catch {
    return {
      error: "Nu am primit un raspuns valid de la server.",
      ok: false,
    };
  }
}

async function searchAdminAppointmentPatients(
  query: string,
): Promise<AdminAppointmentApiResult<AdminAppointmentPatientOption[]>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  const response = await fetch(
    `/api/admin/appointment-patients?q=${encodeURIComponent(query)}`,
    {
      credentials: "same-origin",
      signal: controller.signal,
    },
  );

  window.clearTimeout(timeout);
  return readAdminJsonResult<AdminAppointmentPatientOption[]>(response);
}

async function createAdminPatientForAppointment(input: {
  email: string;
  fullName: string;
  phone: string;
}): Promise<AdminAppointmentApiResult<AdminAppointmentPatientOption>> {
  const response = await fetch("/api/admin/appointment-patients", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readAdminJsonResult<AdminAppointmentPatientOption>(response);
}

async function createAdminAppointmentFromWizard(input: {
  date: string;
  email: string;
  isFirstVisit: boolean;
  patientId: string;
  phone: string;
  serviceSlug: string;
  time: string;
}): Promise<AdminAppointmentApiResult<AdminAppointmentResult>> {
  const response = await fetch("/api/admin/appointments", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readAdminJsonResult<AdminAppointmentResult>(response);
}

function StepPill({
  active,
  done,
  label,
  number,
}: {
  active: boolean;
  done: boolean;
  label: string;
  number: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
        active
          ? "bg-[#31332c] text-[#faf7f6]"
          : done
            ? "bg-[#ffdcbd] text-[#654d35]"
            : "bg-[#efeee6] text-[#5e6058]"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/55 font-serif text-sm tracking-normal text-[#31332c]">
        {done ? <CheckCircle2 className="h-4 w-4" /> : number}
      </span>
      {label}
    </div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#fe8983]/35 bg-[#fff7f6] p-4 text-sm font-semibold leading-6 text-[#752121]">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function AdminNewAppointmentWizard({
  initialDate,
  initialPatients,
  services,
}: {
  initialDate?: string;
  initialPatients: AdminAppointmentPatientOption[];
  services: BookableService[];
}) {
  const [step, setStep] = useState<WizardStep>("patient");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<AdminAppointmentPatientOption[]>(initialPatients);
  const [selectedPatient, setSelectedPatient] =
    useState<AdminAppointmentPatientOption | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [activeCategoryKey, setActiveCategoryKey] = useState(
    () => services[0]?.categoryKey ?? "",
  );
  const [serviceSlug, setServiceSlug] = useState(() => services[0]?.slug ?? "");
  const [selectedDate, setSelectedDate] = useState(initialDate ?? "");
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parseDateValue(initialDate) ?? new Date()),
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsState, setSlotsState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [firstVisit, setFirstVisit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AdminAppointmentResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const serviceCategories = useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        count: number;
        description: string;
        key: string;
        name: string;
        sortOrder: number;
      }
    >();

    services.forEach((service) => {
      const existing = categoryMap.get(service.categoryKey);

      if (existing) {
        existing.count += 1;
        return;
      }

      categoryMap.set(service.categoryKey, {
        count: 1,
        description: service.categoryDescription,
        key: service.categoryKey,
        name: service.categoryName,
        sortOrder: service.categorySortOrder,
      });
    });

    return Array.from(categoryMap.values()).sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
  }, [services]);
  const activeCategory =
    serviceCategories.find((category) => category.key === activeCategoryKey) ??
    serviceCategories[0] ??
    null;
  const activeCategoryServices = useMemo(
    () =>
      services.filter(
        (service) => service.categoryKey === (activeCategory?.key ?? activeCategoryKey),
      ),
    [activeCategory?.key, activeCategoryKey, services],
  );
  const selectedService = useMemo(
    () => services.find((service) => service.slug === serviceSlug) ?? services[0] ?? null,
    [serviceSlug, services],
  );
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const todayValue = toDateValue(new Date());
  const canCreateAppointment =
    Boolean(selectedPatient) &&
    Boolean(selectedService) &&
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    Boolean(contactEmail.trim()) &&
    Boolean(contactPhone.trim());

  useEffect(() => {
    let ignore = false;

    if (!query.trim()) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const result = await searchAdminAppointmentPatients(query);
        if (ignore) return;

        setSearchLoading(false);
        if (result.ok) {
          setPatients(result.data);
        } else {
          setError(result.error);
        }
      } catch {
        if (!ignore) {
          setSearchLoading(false);
          setError("Nu am putut incarca lista de pacienti.");
        }
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!selectedDate || !selectedService?.slug) {
        setSlots([]);
        setSlotsState("idle");
        setSelectedTime("");
        return;
      }

      setSlotsState("loading");
      setSelectedTime("");

      try {
        const response = await fetch(
          `/api/appointments?date=${encodeURIComponent(selectedDate)}&service=${encodeURIComponent(
            selectedService.slug,
          )}`,
        );
        const payload = (await response.json()) as Slot[] | { error?: string };

        if (!response.ok || !Array.isArray(payload)) {
          if (!ignore) {
            setSlots([]);
            setSlotsState("error");
          }
          return;
        }

        if (!ignore) {
          setSlots(payload);
          setSlotsState("ready");
        }
      } catch {
        if (!ignore) {
          setSlots([]);
          setSlotsState("error");
        }
      }
    }

    void loadSlots();

    return () => {
      ignore = true;
    };
  }, [selectedDate, selectedService?.slug]);

  function selectPatient(patient: AdminAppointmentPatientOption) {
    setSelectedPatient(patient);
    setContactEmail(patient.email ?? "");
    setContactPhone(patient.phone ?? "");
    setError(null);
    setStep("appointment");
  }

  function handleCreatePatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createAdminPatientForAppointment({
        email: String(formData.get("email") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      selectPatient(result.data);
    });
  }

  function handleCreateAppointment() {
    if (!selectedPatient || !selectedService) {
      setError("Alege pacientul si serviciul inainte de confirmare.");
      return;
    }

    if (!canCreateAppointment) {
      setError("Completeaza pacientul, serviciul, data, ora, emailul si telefonul.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createAdminAppointmentFromWizard({
        date: selectedDate,
        email: contactEmail,
        isFirstVisit: firstVisit,
        patientId: selectedPatient.id,
        phone: contactPhone,
        serviceSlug: selectedService.slug,
        time: selectedTime,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.data);
      setStep("success");
    });
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#735a42]">
              Programare noua
            </p>
            <h1 className="mt-3 font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c] md:text-6xl">
              Creeaza o consultatie
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e6058]">
              Alege pacientul, serviciul si intervalul disponibil. Programarea se
              confirma automat, se sincronizeaza in calendar si trimite email catre
              pacient.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StepPill active={step === "patient" || step === "new-patient"} done={step === "appointment" || step === "success"} label="Pacient" number="1" />
            <StepPill active={step === "appointment"} done={step === "success"} label="Vizita" number="2" />
            <StepPill active={step === "success"} done={false} label="Succes" number="3" />
          </div>
        </div>
      </header>

      <ErrorMessage message={error} />

      {step === "patient" ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-[#b1b3a9]/10 bg-white shadow-[0px_12px_32px_rgba(49,51,44,0.03)]">
            <div className="border-b border-[#b1b3a9]/10 bg-[#fbf9f4]/80 p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                    Pasul 1
                  </p>
                  <h2 className="mt-2 font-serif text-4xl tracking-[-0.035em] text-[#31332c]">
                    Cautare pacient
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-[#5e6058]">
                    Cauta dupa nume, email sau telefon.
                  </p>
                </div>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ffdcbd] px-6 text-sm font-bold text-[#654d35] transition hover:bg-[#f0cfb0]"
                  onClick={() => {
                    setError(null);
                    setStep("new-patient");
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Adauga pacient nou
                </button>
              </div>

              <label className="mt-8 flex min-h-14 items-center gap-3 rounded-full bg-white px-5 shadow-[0px_12px_24px_rgba(49,51,44,0.04)]">
                <Search className="h-5 w-5 text-[#797c73]" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold text-[#31332c] outline-none placeholder:text-[#797c73]/70 focus:ring-0"
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setQuery(nextQuery);

                    if (nextQuery.trim()) {
                      setSearchLoading(true);
                    } else {
                      setSearchLoading(false);
                      setPatients(initialPatients);
                      setError(null);
                    }
                  }}
                  placeholder="Cauta dupa nume, email sau telefon..."
                  type="search"
                  value={query}
                />
              </label>
            </div>

            <div className="divide-y divide-[#b1b3a9]/10">
              {searchLoading ? (
                <div className="p-8 text-sm font-semibold text-[#5e6058]">
                  Se cauta pacienti...
                </div>
              ) : patients.length ? (
                patients.map((patient) => (
                  <button
                    className="group flex w-full flex-col gap-4 p-6 text-left transition hover:bg-[#f5f4ed]/70 md:flex-row md:items-center md:justify-between md:p-8"
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd]/70 font-serif text-xl font-semibold text-[#654d35]">
                        {getInitials(patient.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-serif text-2xl leading-none text-[#31332c]">
                          {patient.fullName}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-[0.12em] text-[#5e6058]">
                          <span>{patient.email ?? "Fara email"}</span>
                          <span>{patient.phone ?? "Fara telefon"}</span>
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className="rounded-full bg-[#f9f3ea] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#5f5b55]">
                        {patient.statusLabel}
                      </span>
                      <span className="text-sm font-semibold text-[#5e6058]">
                        {patient.latestAppointmentLabel ?? "Nicio vizita anterioara"}
                      </span>
                      <span className="rounded-full bg-[#31332c] px-5 py-2 text-sm font-bold text-[#faf7f6] opacity-100 transition group-hover:bg-[#535252] md:opacity-0 md:group-hover:opacity-100">
                        Selecteaza
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-sm font-semibold text-[#5e6058]">
                  Nu am gasit pacienti. Poti crea un profil nou fara cont.
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] bg-[#f5f4ed] p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-6 font-serif text-3xl leading-tight text-[#31332c]">
              Profil fara cont
            </h3>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#5e6058]">
              Pacientul nou este creat doar in registrul clinicii. Nu se creeaza cont
              de pacient si nu se trimit invitatii de autentificare.
            </p>
          </aside>
        </section>
      ) : null}

      {step === "new-patient" ? (
        <section className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-[#ffdcbd] p-8 text-[#654d35]">
            <button
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]"
              onClick={() => {
                setError(null);
                setStep("patient");
              }}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Inapoi la cautare
            </button>
            <h2 className="font-serif text-5xl leading-none tracking-[-0.04em]">
              Inregistrare pacient nou
            </h2>
            <p className="mt-6 max-w-md text-sm font-semibold leading-7 text-[#6f573e]">
              Colectam doar datele necesare pentru contact si confirmarea programarii.
            </p>
          </div>

          <form
            className="rounded-[2.5rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)] md:p-10"
            onSubmit={handleCreatePatient}
          >
            <div className="space-y-6">
              <label className="block">
                <span className="ml-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                  Nume complet
                </span>
                <input
                  className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-[#efeee6] px-5 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
                  name="fullName"
                  placeholder="ex. Matei Georgescu"
                  required
                  type="text"
                />
              </label>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="ml-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                    Email
                  </span>
                  <input
                    className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-[#efeee6] px-5 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
                    name="email"
                    placeholder="matei@exemplu.ro"
                    required
                    type="email"
                  />
                </label>
                <label className="block">
                  <span className="ml-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                    Telefon
                  </span>
                  <input
                    className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-[#efeee6] px-5 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
                    name="phone"
                    placeholder="+40 7xx xxx xxx"
                    required
                    type="tel"
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#f9f3ea] p-5 text-sm font-semibold leading-7 text-[#5f5b55]">
              Profilul va ramane fara cont pacient. Contul poate fi conectat ulterior,
              daca pacientul se inregistreaza cu acelasi email.
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full bg-[#31332c] px-7 text-sm font-bold text-[#faf7f6] transition hover:bg-[#0e0e0c] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Se creeaza..." : "Continua la programare"}
              </button>
              <button
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#b1b3a9]/35 px-7 text-sm font-bold text-[#5e6058] transition hover:bg-[#f5f4ed]"
                onClick={() => setStep("patient")}
                type="button"
              >
                Anuleaza
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {step === "appointment" && selectedPatient ? (
        <section className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                    01. Serviciu
                  </p>
                  <h2 className="mt-2 font-serif text-4xl tracking-[-0.035em] text-[#31332c]">
                    Configurare vizita
                  </h2>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#5e6058] transition hover:bg-[#f5f4ed]"
                  onClick={() => {
                    setError(null);
                    setStep("patient");
                  }}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Schimba pacient
                </button>
              </div>

              {services.length ? (
                <>
                  <div className="mt-8 flex gap-3 overflow-x-auto rounded-[1.75rem] bg-[#f5f4ed] p-2">
                    {serviceCategories.map((category) => {
                      const active = category.key === activeCategory?.key;

                      return (
                        <button
                          className={`flex min-w-[12rem] flex-col rounded-[1.35rem] px-4 py-3 text-left transition ${
                            active
                              ? "bg-white text-[#31332c] shadow-[0px_12px_24px_rgba(49,51,44,0.07)]"
                              : "text-[#5e6058] hover:bg-white/55 hover:text-[#31332c]"
                          }`}
                          key={category.key}
                          onClick={() => {
                            const nextService = services.find(
                              (service) => service.categoryKey === category.key,
                            );

                            setActiveCategoryKey(category.key);
                            setServiceSlug(nextService?.slug ?? "");
                            setSelectedTime("");
                          }}
                          type="button"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#735a42]">
                            {category.count} servicii
                          </span>
                          <span className="mt-1 font-serif text-xl leading-none">
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeCategory ? (
                    <div className="mt-5 rounded-[1.5rem] border border-[#b1b3a9]/10 bg-[#fbf9f4] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#735a42]">
                        Categoria selectata
                      </p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <h3 className="font-serif text-3xl leading-none text-[#31332c]">
                          {activeCategory.name}
                        </h3>
                        <p className="max-w-xl text-sm font-semibold leading-6 text-[#5e6058]">
                          {activeCategory.description ||
                            "Alege serviciul potrivit pentru aceasta programare."}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {activeCategoryServices.map((service) => {
                      const active = service.slug === selectedService?.slug;

                      return (
                        <button
                          className={`relative rounded-2xl border p-5 text-left transition ${
                            active
                              ? "border-[#735a42]/30 bg-[#ffdcbd]/55 shadow-[0px_12px_28px_rgba(49,51,44,0.08)]"
                              : "border-[#b1b3a9]/12 bg-[#fbf9f4] hover:border-[#735a42]/18 hover:bg-[#f9f3ea]"
                          }`}
                          key={service.id}
                          onClick={() => {
                            setServiceSlug(service.slug);
                            setSelectedTime("");
                          }}
                          type="button"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[#735a42]">
                            <Stethoscope className="h-5 w-5" />
                          </span>
                          <span className="mt-4 block font-serif text-2xl leading-tight text-[#31332c]">
                            {service.title}
                          </span>
                          <span className="mt-2 line-clamp-2 block text-xs font-semibold leading-5 text-[#5e6058]">
                            {service.description || `${service.durationMinutes} minute`}
                          </span>
                          <span className="mt-4 block text-sm font-bold text-[#735a42]">
                            {service.priceLabel}
                          </span>
                          {active ? (
                            <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-[#735a42]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-8 rounded-2xl bg-[#fff7f6] p-5 text-sm font-bold text-[#752121]">
                  Nu exista servicii active si rezervabile.
                </div>
              )}
            </section>

            <section className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
              <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] md:p-8 lg:h-[36rem]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                  02. Data
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-serif text-2xl italic text-[#31332c]">
                    {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      aria-label="Luna anterioara"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeee6] text-[#5f5e5e] transition hover:bg-[#ffdcbd]"
                      onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                      type="button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Luna urmatoare"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeee6] text-[#5f5e5e] transition hover:bg-[#ffdcbd]"
                      onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                      type="button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-7 gap-2 text-center">
                  {weekdayLabels.map((weekday) => (
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#797c73]"
                      key={weekday}
                    >
                      {weekday}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const selected = selectedDate === day.value;
                    const disabled = day.value < todayValue;

                    return (
                      <button
                        className={`aspect-square rounded-full text-sm font-bold transition ${
                          selected
                            ? "bg-[#31332c] text-[#faf7f6]"
                            : day.currentMonth
                              ? "text-[#31332c] hover:bg-[#f9f3ea]"
                              : "text-[#b1b3a9]"
                        } ${disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : ""}`}
                        disabled={disabled}
                        key={day.value}
                        onClick={() => {
                          setSelectedDate(day.value);
                          setSelectedTime("");
                        }}
                        type="button"
                      >
                        {day.dayOfMonth}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] md:p-8 lg:h-[36rem] lg:flex-col">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                  03. Alege ora
                </p>
                <div className="mt-5 min-h-0 space-y-3 lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:[scrollbar-color:#d9dbcf_transparent] lg:[scrollbar-width:thin]">
                  {slotsState === "idle" ? (
                    <div className="rounded-2xl bg-[#f5f4ed] p-5 text-sm font-semibold text-[#5e6058]">
                      Alege data pentru a vedea intervalele.
                    </div>
                  ) : null}
                  {slotsState === "loading" ? (
                    <div className="rounded-2xl bg-[#f5f4ed] p-5 text-sm font-semibold text-[#5e6058]">
                      Se incarca intervalele...
                    </div>
                  ) : null}
                  {slotsState === "error" ? (
                    <div className="rounded-2xl bg-[#fff7f6] p-5 text-sm font-bold text-[#752121]">
                      Nu am putut incarca disponibilitatea.
                    </div>
                  ) : null}
                  {slotsState === "ready" && slots.length ? (
                    slots.map((slot) => {
                      const active = selectedTime === slot.time;
                      const period = getSlotPeriod(slot.time);

                      return (
                        <button
                          className={`flex w-full items-center justify-between rounded-2xl p-4 text-left transition ${
                            active
                              ? "bg-[#ffdcbd] text-[#654d35]"
                              : slot.taken
                                ? "cursor-not-allowed bg-[#efeee6] text-[#797c73] opacity-45"
                                : "bg-[#fbf9f4] text-[#31332c] hover:bg-[#f9f3ea]"
                          }`}
                          disabled={slot.taken}
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          type="button"
                        >
                          <span className="font-bold">{slot.time}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                            {slot.taken ? "Rezervat" : period}
                          </span>
                        </button>
                      );
                    })
                  ) : null}
                  {slotsState === "ready" && !slots.length ? (
                    <div className="rounded-2xl bg-[#f5f4ed] p-5 text-sm font-semibold text-[#5e6058]">
                      Nu sunt intervale disponibile pentru ziua selectata.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
              <h3 className="font-serif text-3xl text-[#31332c]">Sumar</h3>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#f5f4ed] p-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffdcbd]/75 font-serif text-xl font-semibold text-[#654d35]">
                  {getInitials(selectedPatient.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-xl leading-none text-[#31332c]">
                    {selectedPatient.fullName}
                  </span>
                  <span className="mt-2 block truncate text-xs font-bold uppercase tracking-[0.12em] text-[#5e6058]">
                    {selectedPatient.hasAccount ? "Cont pacient" : "Fara cont"}
                  </span>
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="block">
                  <span className="ml-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5e6058]">
                    <Mail className="h-3.5 w-3.5" />
                    Email confirmare
                  </span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border-0 bg-[#efeee6] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
                    onChange={(event) => setContactEmail(event.target.value)}
                    required
                    type="email"
                    value={contactEmail}
                  />
                </label>
                <label className="block">
                  <span className="ml-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5e6058]">
                    <Phone className="h-3.5 w-3.5" />
                    Telefon
                  </span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border-0 bg-[#efeee6] px-4 text-sm font-semibold text-[#31332c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#ffdcbd]"
                    onChange={(event) => setContactPhone(event.target.value)}
                    required
                    type="tel"
                    value={contactPhone}
                  />
                </label>
              </div>

              <div className="mt-6 space-y-4 border-t border-[#b1b3a9]/15 pt-6 text-sm font-semibold text-[#5e6058]">
                <div className="flex items-center justify-between gap-4">
                  <span>Serviciu</span>
                  <span className="text-right font-bold text-[#31332c]">
                    {selectedService?.title ?? "Neselectat"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Data</span>
                  <span className="text-right font-bold text-[#31332c]">
                    {selectedDate ? formatDate(selectedDate) : "Neselectata"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Ora</span>
                  <span className="text-right font-bold text-[#31332c]">
                    {selectedTime || "Neselectata"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Total</span>
                  <span className="text-lg font-semibold tabular-nums text-[#31332c]">
                    {selectedService?.priceLabel ?? "-"}
                  </span>
                </div>
              </div>

              <button
                aria-pressed={firstVisit}
                className={`mt-6 flex w-full items-center justify-between gap-4 rounded-[1.6rem] border p-4 text-left transition ${
                  firstVisit
                    ? "border-[#735a42]/20 bg-[#ffdcbd]/55 shadow-[0px_12px_24px_rgba(115,90,66,0.08)]"
                    : "border-[#b1b3a9]/14 bg-[#f9f3ea] hover:bg-[#f5f4ed]"
                }`}
                onClick={() => setFirstVisit((current) => !current)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                      firstVisit
                        ? "bg-[#735a42] text-[#fff7f3]"
                        : "bg-white text-[#797c73]"
                    }`}
                  >
                    {firstVisit ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </span>
                  <span>
                    <span className="block font-serif text-xl text-[#5f5b55]">
                      Prima vizita
                    </span>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#69665f]">
                      {firstVisit
                        ? "Evaluarea Nutritionala poate fi necesara"
                        : "Pacient revenit"}
                    </span>
                  </span>
                </span>
                <span
                  className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition ${
                    firstVisit ? "bg-[#735a42]" : "bg-[#d9dbcf]"
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white shadow-[0px_4px_10px_rgba(49,51,44,0.16)] transition-transform ${
                      firstVisit ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              <button
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#31332c] px-6 text-sm font-bold text-[#faf7f6] transition hover:bg-[#0e0e0c] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!canCreateAppointment || isPending}
                onClick={handleCreateAppointment}
                type="button"
              >
                <CalendarCheck className="h-4 w-4" />
                {isPending ? "Se confirma..." : "Confirma programarea"}
              </button>

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-[#797c73]">
                Emailul de confirmare se trimite automat dupa salvare.
              </p>
            </div>
          </aside>
        </section>
      ) : null}

      {step === "success" && success ? (
        <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-[#b1b3a9]/10 bg-white p-8 text-center shadow-[0px_16px_44px_rgba(49,51,44,0.06)] md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f9f3ea] text-[#625f58]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mt-8 font-serif text-5xl leading-none tracking-[-0.04em] text-[#31332c]">
            Programare creata cu succes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-[#5e6058]">
            Programarea a fost salvata, confirmarea a fost trimisa catre pacient,
            iar sincronizarea calendarului este {formatSyncStatus(success.syncStatus).toLowerCase()}.
          </p>

          <div className="mt-10 grid gap-4 rounded-[2rem] bg-[#f5f4ed] p-6 text-left md:grid-cols-2">
            <SummaryFact icon={<UserRound className="h-4 w-4" />} label="Pacient" value={success.patientName} />
            <SummaryFact icon={<Mail className="h-4 w-4" />} label="Email" value={success.patientEmail} />
            <SummaryFact icon={<Stethoscope className="h-4 w-4" />} label="Serviciu" value={success.serviceName} />
            <SummaryFact
              icon={<Clock3 className="h-4 w-4" />}
              label="Interval"
              value={`${formatDateTime(success.startAt)} - ${new Date(success.endAt).toLocaleTimeString("ro-RO", {
                hour: "2-digit",
                hour12: false,
                minute: "2-digit",
                timeZone: "Europe/Bucharest",
              })}`}
            />
            <SummaryFact
              icon={<CalendarDays className="h-4 w-4" />}
              label="Calendar"
              value={formatSyncStatus(success.syncStatus)}
            />
            <SummaryFact
              icon={<Sparkles className="h-4 w-4" />}
              label="Evaluare"
              value={success.requiresIntake ? "In asteptare" : "Nu este necesara"}
            />
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-[#31332c] px-7 text-sm font-bold text-[#faf7f6] transition hover:bg-[#0e0e0c]"
              href="/admin/appointments"
            >
              Inapoi la calendar
            </Link>
            <Link
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-[#b1b3a9]/35 px-7 text-sm font-bold text-[#5e6058] transition hover:bg-[#f5f4ed] hover:text-[#31332c]"
              href={`/admin/appointments/${success.appointmentId}`}
            >
              Vezi detalii
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#797c73]">
        {icon}
        {label}
      </span>
      <p className="mt-2 font-serif text-xl leading-tight text-[#31332c]">{value}</p>
    </div>
  );
}
