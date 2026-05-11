import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PatientAppointmentsCalendar } from "@/components/site/patient-appointments-calendar";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import {
  getPortalAppointmentStatusLabel,
  getPortalQuestionnaireStatusLabel,
  listPatientPortalAppointments,
} from "@/modules/patients/portal";

function questionnaireTone(status: string) {
  if (status === "required") {
    return "bg-[#fff3e6] text-[#7a5a35]";
  }

  if (status === "submitted_for_appointment" || status === "on_file") {
    return "bg-[#edf6ee] text-[#3f6a4b]";
  }

  return "bg-[#efeee6] text-[#5e6058]";
}

type PatientAppointmentsPageProps = {
  searchParams: Promise<{
    appointment?: string;
  }>;
};

export default async function PatientAppointmentsPage({
  searchParams,
}: PatientAppointmentsPageProps) {
  const { appointment: requestedAppointmentId } = await searchParams;
  const { user, patient } = await getCurrentPatientAccount();
  const requestHeaders = await headers();

  if (!user || !patient) {
    redirect("/cont/autentificare?redirectTo=/cont/programari");
  }

  const appointments = await listPatientPortalAppointments({
    patientId: patient.id,
    limit: 24,
  });

  return (
    <section className="space-y-8">
      <header className="rounded-[2.25rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
          Programari
        </p>
        <h1 className="mt-4 font-serif text-5xl text-[#31332c]">
          Programarile tale
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5e6058]">
          Verifica statusul fiecarei rezervari, vezi codul de referinta si
          continua Evaluarea Nutritionala atunci cand este necesar.
        </p>
      </header>

      <PatientAppointmentsCalendar
        appointments={appointments}
        description="Navigheaza pe luni si vezi rapid zilele in care ai rezervari, fara sa iesi din contul tau."
        initialAppointmentId={requestedAppointmentId}
        key={requestedAppointmentId ?? "calendar"}
        nonce={requestHeaders.get("x-nonce")}
        title="Calendarul tau de programari"
      />

      {appointments.length ? (
        <div className="grid gap-5">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                    {getPortalAppointmentStatusLabel(appointment.status)}
                  </p>
                  <h2 className="font-serif text-3xl text-[#31332c]">
                    {appointment.serviceName}
                  </h2>
                  <p className="text-base text-[#5e6058]">
                    {new Date(appointment.startAt).toLocaleString("ro-RO")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${questionnaireTone(
                        appointment.questionnaireStatus,
                      )}`}
                    >
                      {getPortalQuestionnaireStatusLabel(
                        appointment.questionnaireStatus,
                      )}
                    </span>
                    {appointment.referenceHint ? (
                      <span className="inline-flex rounded-full bg-[#efeee6] px-4 py-2 text-xs font-semibold text-[#5e6058]">
                        Cod: {appointment.referenceHint}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-5 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
                    href={`/cont/programari?appointment=${appointment.id}`}
                  >
                    Vezi status
                  </Link>
                  {appointment.questionnaireStatus === "required" ? (
                    <Link
                      className="inline-flex items-center justify-center rounded-full bg-[#5f5e5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#535252]"
                      href={`/programare/chestionar?appointment=${appointment.id}`}
                    >
                      Continua evaluarea
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-[#b1b3a9]/30 bg-[#f5f4ed] px-6 py-5 text-sm text-[#5e6058]">
          Nu ai inca programari salvate in contul tau.
        </div>
      )}
    </section>
  );
}
