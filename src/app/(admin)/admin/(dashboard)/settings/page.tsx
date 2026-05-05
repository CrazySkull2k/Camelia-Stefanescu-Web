import type { ReactNode } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe2,
  Mail,
  Palette,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { hasServerEnv } from "@/lib/env/server";
import {
  getClinicSettings,
} from "@/modules/settings/service";
import {
  buildHalfHourTimeOptions,
  clinicWeekdays,
} from "@/modules/settings/schedule";

const scheduleTimeOptions = buildHalfHourTimeOptions({
  startMinutes: 6 * 60,
  endMinutes: 23 * 60,
  includeEnd: true,
});

function formatScheduleWindow(day: { enabled: boolean; end: string; start: string }) {
  return day.enabled ? `${day.start} - ${day.end}` : "Inchis";
}

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const clinicSettings = await getClinicSettings();
  const query = await searchParams;
  const enabledDaysCount = clinicWeekdays.filter(
    (weekday) => clinicSettings.appointmentSchedule[weekday.key].enabled,
  ).length;
  const hasManualConfirmation =
    clinicSettings.requireManualAppointmentConfirmation;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-14rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#ffdcbd]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[#e4e2e1]/40 blur-[100px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
        <form action="/api/admin/settings" className="space-y-12" method="post">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#735a42]">
                Administrare cabinet
              </span>
              <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-[#31332c] md:text-7xl">
                Centru de Control
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#5e6058]">
                Gestioneaza fundatia operationala: programul cabinetului,
                regulile de confirmare si configuratiile care sustin experienta
                pacientului.
              </p>
            </div>

            <button
              className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-6 text-sm font-bold !text-[#faf7f6] transition hover:bg-[#535252] hover:!text-[#faf7f6]"
              type="submit"
            >
              <Save className="h-4 w-4" />
              Salveaza setarile
            </button>
          </header>

          {error ? (
            <div className="rounded-[1.5rem] border border-[#fe8983]/40 bg-[#fff7f6] px-5 py-4 text-sm font-semibold text-[#752121]">
              {error}
            </div>
          ) : null}
          {!error && status ? (
            <div className="rounded-[1.5rem] border border-[#ffdcbd]/60 bg-[#fff7f3] px-5 py-4 text-sm font-semibold text-[#654d35]">
              Setarile cabinetului au fost salvate.
            </div>
          ) : null}

          <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="group relative h-full overflow-hidden rounded-[2.5rem] bg-white p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.04)] transition duration-500 hover:shadow-[0px_24px_48px_rgba(49,51,44,0.08)] md:p-10">
                <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.04] transition duration-700 group-hover:scale-110">
                  <CalendarDays className="h-40 w-40 text-[#31332c]" />
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                  <div>
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#ffdcbd] text-[#735a42]">
                      <Clock3 className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#735a42]">
                      Program clinica
                    </p>
                    <h2 className="mt-3 font-serif text-4xl italic leading-none text-[#31332c]">
                      Ore disponibile pentru programari
                    </h2>
                    <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[#5e6058]">
                      Sloturile publice, wizard-ul de programare si blocurile din
                      calendar folosesc aceste intervale. Orele sunt generate din
                      30 in 30 de minute.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {clinicWeekdays.map((weekday) => {
                      const day = clinicSettings.appointmentSchedule[weekday.key];

                      return (
                        <div
                          className="grid gap-3 rounded-[1.35rem] bg-[#f5f4ed] p-4 md:grid-cols-[minmax(0,1fr)_9rem_9rem]"
                          key={weekday.key}
                        >
                          <label className="flex items-center gap-4">
                            <input
                              className="peer sr-only"
                              defaultChecked={day.enabled}
                              name={`schedule_${weekday.key}_enabled`}
                              type="checkbox"
                            />
                            <span className="flex h-9 w-16 items-center rounded-full bg-[#d9dbcf] p-1 transition peer-checked:bg-[#ffdcbd] peer-checked:[&>span]:translate-x-7">
                              <span className="h-7 w-7 rounded-full bg-white transition" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-[#31332c]">
                                {weekday.label}
                              </span>
                              <span className="block text-xs font-semibold text-[#797c73]">
                                {formatScheduleWindow(day)}
                              </span>
                            </span>
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                              Start
                            </span>
                            <select
                              className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-white px-4 text-sm font-bold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
                              defaultValue={day.start}
                              name={`schedule_${weekday.key}_start`}
                            >
                              {scheduleTimeOptions.map((option) => (
                                <option
                                  key={`${weekday.key}-start-${option.value}`}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#5e6058]">
                              Final
                            </span>
                            <select
                              className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-white px-4 text-sm font-bold text-[#31332c] outline-none transition focus:border-[#ffdcbd] focus:ring-2 focus:ring-[#ffdcbd]/40"
                              defaultValue={day.end}
                              name={`schedule_${weekday.key}_end`}
                            >
                              {scheduleTimeOptions.map((option) => (
                                <option
                                  key={`${weekday.key}-end-${option.value}`}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <span className="h-1 w-12 rounded-full bg-[#735a42]" />
                    <span className="h-1 w-4 rounded-full bg-[#ffdcbd]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 lg:col-span-5">
              <ControlCard
                icon={<Palette className="h-8 w-8" />}
                eyebrow="Identitate vizuala"
                title="Brand public"
                description="Logo, imagini si accente de continut se gestioneaza din editorul de pagini si blog."
                tone="light"
              >
                <div className="mt-auto grid grid-cols-4 gap-2">
                  <span className="aspect-square rounded-xl bg-[#5f5e5e]" />
                  <span className="aspect-square rounded-xl bg-[#ffdcbd]" />
                  <span className="aspect-square rounded-xl bg-[#f9f3ea]" />
                  <span className="aspect-square rounded-xl bg-[#e2e3d9]" />
                </div>
              </ControlCard>

              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#e8e9e0] p-7 md:p-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/45 text-[#5f5e5e]">
                  <CalendarClock className="h-8 w-8" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
                  Configurare programari
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-none text-[#31332c]">
                  Confirmare programari
                </h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-[#5e6058]">
                  Daca este activa, programarile noi raman in pending pana la
                  verificarea din dashboard. Daca este oprita, se confirma
                  automat, dar slotul ramane blocat.
                </p>

                <label className="mt-8 flex cursor-pointer items-center justify-between gap-5 rounded-[1.5rem] bg-white/65 p-4">
                  <span>
                    <span className="block text-sm font-bold text-[#31332c]">
                      Confirmare manuala
                    </span>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#797c73]">
                      {hasManualConfirmation ? "Activata" : "Dezactivata"}
                    </span>
                  </span>
                  <input
                    className="peer sr-only"
                    defaultChecked={hasManualConfirmation}
                    name="require_manual_appointment_confirmation"
                    type="checkbox"
                  />
                  <span className="flex h-10 w-[4.5rem] items-center rounded-full bg-[#d9dbcf] p-1 transition peer-checked:bg-[#ffdcbd] peer-checked:[&>span]:translate-x-[2rem]">
                    <span className="h-8 w-8 rounded-full bg-white transition" />
                  </span>
                </label>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative flex h-full min-h-[25rem] flex-col overflow-hidden rounded-[2.5rem] bg-[#0e0e0c] p-8 text-[#fbf9f4] shadow-[0px_24px_48px_rgba(49,51,44,0.14)] md:p-10">
                <Settings className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 text-white/5" />
                <div className="relative z-10">
                  <div className="mb-12 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/75">
                    <span className="h-2 w-2 rounded-full bg-[#fe8983]" />
                    Nucleu sistem
                  </div>
                  <h2 className="font-serif text-5xl leading-none text-[#fbf9f4]">
                    Setari Sistem
                  </h2>
                  <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-white/65">
                    Starea integratiilor operationale. Aceste valori sunt
                    informative aici; configurarea lor se face prin environment
                    si migrari.
                  </p>
                </div>

                <div className="relative z-10 mt-auto grid gap-3 sm:grid-cols-2">
                  <SystemPill
                    label="Supabase"
                    value={hasServerEnv() ? "Configurat" : "Lipsa env"}
                  />
                  <SystemPill label="Google Calendar" value="Calendar cabinet" />
                  <SystemPill label="Resend" value="Email tranzactional" />
                  <SystemPill label="RLS & buckets" value="Migrari Supabase" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid h-full gap-4">
                <MetricCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Program activ"
                  value={`${enabledDaysCount} zile`}
                  text="Zile disponibile pentru programari publice si admin."
                />
                <MetricCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Intervale"
                  value="30 min"
                  text="Toate sloturile sunt generate pe baza acestui pas."
                />
                <MetricCard
                  icon={<Sparkles className="h-5 w-5" />}
                  label="Regula calendar"
                  value="Zero overlap"
                  text="Programarile si blocurile custom ocupa disponibilitatea."
                />
              </div>
            </div>
          </section>
        </form>

        <section className="mt-16 border-t border-[#b1b3a9]/15 pt-12">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="font-serif text-3xl italic text-[#31332c]">
              Preferinte administrative adiacente
            </h3>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#797c73]">
              Informativ
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MicroSetting
              icon={<Globe2 className="h-5 w-5" />}
              title="Limba si regiune"
              text="Format orar, fus orar si limba interfetei."
            />
            <MicroSetting
              icon={<Mail className="h-5 w-5" />}
              title="Notificari email"
              text="Sabloane de email si frecventa alertelor."
            />
            <MicroSetting
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Confidentialitate"
              text="GDPR, consimtamant si politica de date."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ControlCard({
  children,
  description,
  eyebrow,
  icon,
  title,
  tone,
}: {
  children?: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
  tone: "light";
}) {
  return (
    <div
      className={
        tone === "light"
          ? "flex min-h-[22rem] flex-col rounded-[2.5rem] bg-[#f5f4ed] p-7 transition duration-500 hover:bg-white hover:shadow-[0px_24px_48px_rgba(49,51,44,0.08)] md:p-10"
          : undefined
      }
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#625f58]/10 bg-[#f9f3ea] text-[#625f58]">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#797c73]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-none text-[#31332c]">
        {title}
      </h2>
      <p className="mt-4 text-sm font-semibold leading-7 text-[#5e6058]">
        {description}
      </p>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

function SystemPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80">
      <span className="font-bold text-white">{label}:</span> {value}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  text,
  value,
}: {
  icon: ReactNode;
  label: string;
  text: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ffdcbd]/65 text-[#654d35]">
          {icon}
        </span>
        <span>
          <span className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#797c73]">
            {label}
          </span>
          <span className="mt-1 block font-serif text-3xl leading-none text-[#31332c]">
            {value}
          </span>
          <span className="mt-2 block text-sm font-semibold leading-6 text-[#5e6058]">
            {text}
          </span>
        </span>
      </div>
    </div>
  );
}

function MicroSetting({
  icon,
  text,
  title,
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="group flex items-start gap-5 rounded-[1.75rem] p-5 transition duration-300 hover:bg-[#efeee6]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e2e3d9] text-[#5f5e5e] transition group-hover:bg-white">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-[#31332c]">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-[#5e6058]">
          {text}
        </span>
      </span>
    </div>
  );
}
