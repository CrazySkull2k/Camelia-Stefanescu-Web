import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  FlaskConical,
  LifeBuoy,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { HorizontalProgressBar } from "@/components/shared/horizontal-progress-bar";
import { PatientAppointmentsCalendar } from "@/components/site/patient-appointments-calendar";
import { siteContact } from "@/content/site-content";
import { getPatientQuestionnaireStatus } from "@/modules/forms/questionnaire";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import {
  getPortalQuestionnaireStatusLabel,
  getUpcomingPatientPortalAppointment,
  listPatientPortalAppointments,
} from "@/modules/patients/portal";

function formatRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return `${start.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const quickActions = [
  {
    href: "/programare",
    label: "Rezerva o consultatie",
    description: "Porneste rapid o rezervare noua din contul tau.",
    icon: Stethoscope,
  },
  {
    href: "/cont/chestionar",
    label: "Evaluare nutritionala",
    description: "Deschide versiunea curenta si istoricul salvarilor.",
    icon: ClipboardList,
  },
  {
    href: "/cont/profil",
    label: "Actualizeaza profilul",
    description: "Completeaza datele folosite la programari si dosar.",
    icon: UserRound,
  },
  {
    href: "/cont/analize",
    label: "Analize",
    description: "Vezi lista necesara pentru prima consultatie.",
    icon: FlaskConical,
  },
  {
    href: "/cont/support",
    label: "Cere support",
    description: "Alege rapid canalul potrivit pentru ajutor.",
    icon: LifeBuoy,
  },
] as const;

export default async function PatientDashboardPage() {
  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    redirect("/cont/autentificare?redirectTo=/cont/dashboard");
  }

  const [upcomingAppointment, appointments, questionnaireStatus] =
    await Promise.all([
      getUpcomingPatientPortalAppointment(patient.id),
      listPatientPortalAppointments({ patientId: patient.id, limit: 12 }),
      getPatientQuestionnaireStatus(patient.id),
    ]);
  const requestHeaders = await headers();

  const firstName =
    patient.full_name.split(/\s+/).find(Boolean) ??
    user.email?.split("@")[0] ??
    "Pacient";

  const activeAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "pending" || appointment.status === "confirmed",
  );

  const profileFields = [
    patient.full_name,
    user.email ?? null,
    patient.phone,
    patient.birth_date,
    patient.sex,
  ];

  const profileCompleteness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );

  const questionnaireCtaAppointment = activeAppointments.find(
    (appointment) => appointment.questionnaireStatus === "required",
  );

  const consultationChecklist = [
    {
      label: "Profil pacient",
      complete: profileCompleteness === 100,
      detail:
        profileCompleteness === 100
          ? "Datele de baza sunt complete."
          : "Mai sunt campuri de completat in profil.",
    },
    {
      label: "Evaluare nutritionala",
      complete: questionnaireStatus.state === "completed",
      detail:
        questionnaireStatus.state === "completed"
          ? "Versiunea curenta este deja salvata."
          : "Evaluarea nutritionala trebuie verificata inainte de consult.",
    },
    {
      label: "Analize recente",
      complete: false,
      detail: "Se aduc la prima consultatie, nu se incarca inca online.",
    },
  ] as const;

  const consultationReadiness = Math.round(
    (consultationChecklist.filter((item) => item.complete).length /
      consultationChecklist.length) *
      100,
  );

  return (
    <div className="pb-6">
      <header className="mb-12">
        <h1 className="font-serif text-5xl text-[#31332c] md:text-6xl">
          Bine ai revenit, {firstName}
        </h1>
        <p className="mt-2 text-lg text-[#5e6058]">
          Panoul tau personal pentru programari, profil si Evaluarea Nutritionala.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <section className="space-y-4 md:col-span-7 lg:col-span-8">
          <div className="flex flex-col rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
                  Programare apropiata
                </span>
                <h2 className="font-serif text-4xl text-[#31332c]">
                  {upcomingAppointment
                    ? "Urmatoarea programare"
                    : "Planifica urmatoarea consultatie"}
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ffdcbd] px-6 py-3 text-[#654d35]">
                <span className="text-sm font-semibold">
                  {upcomingAppointment
                    ? new Date(upcomingAppointment.startAt).toLocaleDateString(
                        "ro-RO",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "Fara programare activa"}
                </span>
              </div>
            </div>

            {upcomingAppointment ? (
              <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efeee6] text-[#5f5e5e]">
                      <Clock3 className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <div>
                      <p className="text-sm text-[#797c73]">Interval</p>
                      <p className="text-lg font-semibold text-[#31332c]">
                        {formatRange(
                          upcomingAppointment.startAt,
                          upcomingAppointment.endAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efeee6] text-[#5f5e5e]">
                      <Stethoscope className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <div>
                      <p className="text-sm text-[#797c73]">Serviciu</p>
                      <p className="text-lg font-semibold text-[#31332c]">
                        {upcomingAppointment.serviceName}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-[#f9f3ea] px-5 py-4 text-sm text-[#5e6058]">
                    {upcomingAppointment.questionnaireStatus === "required"
                      ? "Programarea este blocata pentru tine, iar evaluarea nutritionala trebuie completata inainte de consultatie."
                      : `Status evaluare: ${getPortalQuestionnaireStatusLabel(
                          upcomingAppointment.questionnaireStatus,
                        )}.`}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    className="inline-flex items-center justify-center rounded-full bg-[#252c28] px-8 py-4 text-center text-sm font-semibold !text-white transition hover:bg-[#1d221f]"
                    href={`/cont/programari?appointment=${upcomingAppointment.id}`}
                  >
                    Vezi statusul programarii
                  </Link>
                  {upcomingAppointment.questionnaireStatus === "required" ? (
                    <Link
                      className="text-center text-sm font-semibold text-[#5f5e5e] transition hover:underline"
                      href={`/programare/chestionar?appointment=${upcomingAppointment.id}`}
                    >
                      Continua evaluarea
                    </Link>
                  ) : (
                    <Link
                      className="text-center text-sm font-semibold text-[#5f5e5e] transition hover:underline"
                      href="/programare"
                    >
                      Rezerva o noua consultatie
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="rounded-[1.75rem] bg-[#f5f4ed] p-6 text-sm leading-7 text-[#5e6058]">
                  Nu ai o programare viitoare confirmata in acest moment. Poti
                  rezerva direct din contul tau, iar datele profilului vor fi
                  precompletate automat.
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    className="inline-flex items-center justify-center rounded-full bg-[#5f5e5e] px-8 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#535252]"
                    href="/programare"
                  >
                    Rezerva o consultatie
                  </Link>
                  <Link
                    className="text-center text-sm font-semibold text-[#5f5e5e] transition hover:underline"
                    href="/cont/programari"
                  >
                    Vezi istoricul programarilor
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-[#b1b3a9]/10 bg-[#f5f4ed] px-5 py-4 shadow-[0px_12px_32px_rgba(49,51,44,0.04)]">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                Actiuni rapide
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      className="flex min-h-[8.25rem] flex-col justify-between rounded-[1.5rem] border border-transparent bg-white px-4 py-4 text-left transition-all duration-200 hover:-translate-y-[2px] hover:border-[#ae8462]/20 hover:bg-[#f7e8d8] hover:shadow-[0_16px_28px_rgba(120,88,57,0.08)]"
                      href={action.href}
                    >
                      <div>
                        <Icon
                          className="mx-auto h-5 w-5 text-[#886349]"
                          strokeWidth={1.7}
                        />
                        <h3 className="mt-3 font-serif text-[1.25rem] italic leading-none text-[#2f322d]">
                          {action.label}
                        </h3>
                        <p className="mt-2 text-[0.76rem] leading-6 text-[#66675f]">
                          {action.description}
                        </p>
                      </div>

                      <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#886349]/24 bg-white/78 text-[#797c73]">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="flex h-full flex-col gap-6 md:col-span-5 lg:col-span-4">
          <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <h3 className="font-serif text-2xl text-[#31332c]">
              Profil pacient
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#5e6058]">
              Vezi rapid cat de pregatit este dosarul tau pentru urmatoarea
              consultatie.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                    Profil pacient
                  </p>
                  <span className="text-sm font-semibold text-[#31332c]">
                    {profileCompleteness}%
                  </span>
                </div>
                <HorizontalProgressBar color="#735a42" value={profileCompleteness} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                    Pregatire prima consultatie
                  </p>
                  <span className="text-sm font-semibold text-[#31332c]">
                    {consultationReadiness}%
                  </span>
                </div>
                <HorizontalProgressBar color="#5f5e5e" value={consultationReadiness} />
              </div>

              <div className="space-y-2">
                {consultationChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 rounded-[1.25rem] bg-[#fbf9f4] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#31332c]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-[#5e6058]">
                        {item.detail}
                      </p>
                    </div>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
                        item.complete
                          ? "bg-[#edf6ee] text-[#3f6a4b]"
                          : "bg-[#fff3e6] text-[#7a5a35]"
                      }`}
                    >
                      {item.complete ? "Gata" : "De pregatit"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            className="mt-auto flex items-center justify-between gap-4 rounded-[1.75rem] border border-[#b1b3a9]/10 bg-white px-5 py-4 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#ae8462]/20 hover:bg-[#f7e8d8] hover:shadow-[0_16px_28px_rgba(120,88,57,0.08)]"
            href="/cont/support"
          >
            <div className="flex items-center gap-4">
              <LifeBuoy className="h-5 w-5 text-[#886349]" strokeWidth={1.7} />
              <div>
                <p className="font-serif text-[1.25rem] italic leading-none text-[#2f322d]">
                  Support clinic
                </p>
                <p className="mt-2 text-[0.78rem] leading-6 text-[#66675f]">
                  {siteContact.phone} • {siteContact.email}
                </p>
              </div>
            </div>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#886349]/24 bg-white/78 text-[#797c73]">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </aside>

        <section className="md:col-span-12">
          <div className="rounded-[3rem] bg-[#f5f4ed] p-10">
            <div className="mb-12 max-w-2xl">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
                Parcursul tau
              </span>
              <h2 className="font-serif text-5xl text-[#31332c]">
                Dosarul tau personal
              </h2>
              <p className="mt-4 text-[#5e6058]">
                Tot ce tine de relatia ta cu cabinetul este adunat aici:
                programari, profil si Evaluarea Nutritionala.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="relative overflow-hidden rounded-[2rem] bg-white p-8">
                <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-bl-full bg-[#ffdcbd]/20" />
                <span className="mb-6 block font-serif text-4xl italic text-[#5f5e5e]">
                  01
                </span>
                <h3 className="text-lg font-semibold text-[#31332c]">
                  Evaluare Nutritionala
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                  {questionnaireStatus.state === "completed"
                    ? "Versiunea curenta este deja salvata in profilul tau si poate fi accesata oricand."
                    : questionnaireStatus.state === "outdated"
                      ? "Exista o versiune mai veche in istoric. Daca publicam una noua, aceasta va trebui completata la o programare viitoare."
                      : "Inca nu ai completat versiunea curenta a evaluarii nutritionale."}
                </p>
                <span className="mt-6 inline-flex rounded-full bg-[#f9f3ea] px-4 py-1 text-xs font-semibold text-[#654d35]">
                  {questionnaireStatus.state === "completed"
                    ? "IN PROFIL"
                    : questionnaireStatus.state === "outdated"
                      ? "NECESITA ACTUALIZARE"
                      : "NEINCEPUT"}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-white p-8">
                <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-bl-full bg-[#ffdcbd]/20" />
                <span className="mb-6 block font-serif text-4xl italic text-[#5f5e5e]">
                  02
                </span>
                <h3 className="text-lg font-semibold text-[#31332c]">
                  Programari active
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                  Ai {activeAppointments.length} programari active in sistem.
                  Din aceasta sectiune poti verifica statusul fiecareia si poti
                  relua rapid rezervarea potrivita.
                </p>
                <span className="mt-6 inline-flex rounded-full bg-[#ffdcbd] px-4 py-1 text-xs font-semibold text-[#654d35]">
                  {activeAppointments.length} PROGRAMARI ACTIVE
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#5f5e5e]/10 bg-white p-8">
                <div className="absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-bl-full bg-[#e4e2e1]/60" />
                <span className="mb-6 block font-serif text-4xl italic text-[#5f5e5e]">
                  03
                </span>
                <h3 className="text-lg font-semibold text-[#31332c]">
                  Urmatorul pas
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                  {questionnaireCtaAppointment
                    ? "Ai deja o programare blocata pentru care trebuie completata evaluarea nutritionala."
                    : "Poti continua cu actualizarea profilului sau cu o noua rezervare direct din cont."}
                </p>
                <Link
                  className="mt-6 inline-flex rounded-full bg-[#5f5e5e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#535252]"
                  href={
                    questionnaireCtaAppointment
                      ? `/programare/chestionar?appointment=${questionnaireCtaAppointment.id}`
                      : "/cont/profil"
                  }
                >
                  {questionnaireCtaAppointment
                    ? "ACTIUNE NECESARA"
                    : "DESCHIDE PROFILUL"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="md:col-span-12">
          <PatientAppointmentsCalendar
            appointments={appointments}
            description="Ai si o vedere lunara a rezervarilor, ca sa vezi rapid zilele ocupate si detaliile fiecarei consultatii."
            nonce={requestHeaders.get("x-nonce")}
            title="Calendarul tau de programari"
          />
        </section>
      </div>
    </div>
  );
}
