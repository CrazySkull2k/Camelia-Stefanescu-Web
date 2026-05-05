"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  Clock3,
  FileCheck2,
  Hash,
  Stethoscope,
} from "lucide-react";
import clsx from "clsx";

import {
  getPortalAppointmentStatusLabel,
  getPortalQuestionnaireStatusLabel,
  type PatientPortalAppointment,
} from "@/modules/patients/portal-shared";
import {
  MorphEventsCalendar,
  type MorphCalendarEvent,
} from "@/components/shared/morph-events-calendar";

type PatientAppointmentsCalendarProps = {
  appointments: PatientPortalAppointment[];
  description?: string;
  initialAppointmentId?: string | null;
  title?: string;
};

type CalendarPatientAppointment = PatientPortalAppointment & MorphCalendarEvent;

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: PatientPortalAppointment["status"]) {
  if (status === "confirmed") {
    return "bg-[#edf6ee] text-[#3f6a4b]";
  }

  if (status === "completed") {
    return "bg-[#efeee6] text-[#5e6058]";
  }

  if (status === "cancelled") {
    return "bg-[#fff3f2] text-[#94494a]";
  }

  return "bg-[#fff3e6] text-[#7a5a35]";
}

function AppointmentStatusView({
  appointment,
  onBack,
}: {
  appointment: PatientPortalAppointment;
  onBack: () => void;
}) {
  const requiresQuestionnaire = appointment.questionnaireStatus === "required";
  const questionnaireDone =
    appointment.questionnaireStatus === "on_file" ||
    appointment.questionnaireStatus === "submitted_for_appointment";

  return (
    <div className="rounded-[1.75rem] bg-[#fbf9f4] p-5 md:p-6">
      <button
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b1b3a9]/16 bg-white px-4 py-2 text-sm font-semibold text-[#5f5e5e] transition hover:bg-[#fff7f3]"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Inapoi la calendar
      </button>

      <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
              Programarea ta
            </p>
            <h3 className="mt-3 font-serif text-4xl italic leading-none text-[#31332c]">
              {getPortalAppointmentStatusLabel(appointment.status)}
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e6058]">
              Statusul este verificat direct din contul tau. Aici apar doar
              programarile asociate profilului autentificat.
            </p>
          </div>
          <span
            className={clsx(
              "inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
              statusTone(appointment.status),
            )}
          >
            {getPortalAppointmentStatusLabel(appointment.status)}
          </span>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.4rem] bg-[#f5f4ed] p-5">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-[#735a42]" />
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                Serviciu
              </p>
            </div>
            <p className="mt-3 text-base font-semibold leading-7 text-[#31332c]">
              {appointment.serviceName}
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-[#f5f4ed] p-5">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[#735a42]" />
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                Data si ora
              </p>
            </div>
            <p className="mt-3 text-base font-semibold leading-7 text-[#31332c]">
              {formatDate(appointment.startAt)}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#5e6058]">
              {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-[#f5f4ed] p-5">
            <div className="flex items-center gap-3">
              <FileCheck2 className="h-5 w-5 text-[#735a42]" />
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                Evaluare
              </p>
            </div>
            <p className="mt-3 text-base font-semibold leading-7 text-[#31332c]">
              {getPortalQuestionnaireStatusLabel(appointment.questionnaireStatus)}
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-[#f5f4ed] p-5">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-[#735a42]" />
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                Cod programare
              </p>
            </div>
            <p className="mt-3 text-base font-semibold tracking-[0.08em] text-[#31332c]">
              {appointment.referenceHint ?? "Indisponibil"}
            </p>
          </div>
        </div>

        {requiresQuestionnaire ? (
          <div className="mt-7 flex flex-col gap-5 rounded-[1.5rem] border border-[#f0b8ad] bg-[#fff3f2] p-5 text-[#752121] md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fe8983] text-lg font-black text-[#752121]">
                !
              </span>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.18em]">
                  Evaluarea nutritionala nu este finalizata
                </h4>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#752121]/80">
                  Slotul a ramas blocat pentru tine. Completeaza evaluarea ca
                  sa fie totul pregatit pentru consultatie.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#252c28] px-5 py-3 text-sm font-semibold !text-white transition hover:bg-[#1d221f]"
              href={`/programare/chestionar?appointment=${appointment.id}`}
            >
              Completeaza evaluarea
            </Link>
          </div>
        ) : null}

        {questionnaireDone ? (
          <div className="mt-7 flex items-start gap-4 rounded-[1.5rem] border border-[#cfe3d1] bg-[#edf6ee] p-5 text-[#3f6a4b]">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold leading-7">
              Evaluarea Nutritionala este disponibila pentru aceasta programare.
            </p>
          </div>
        ) : null}

        {appointment.status === "cancelled" ? (
          <div className="mt-7 flex items-start gap-4 rounded-[1.5rem] border border-[#f0b8ad] bg-[#fff3f2] p-5 text-[#94494a]">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold leading-7">
              Aceasta programare este anulata. Pentru o noua rezervare, poti
              folosi sectiunea Programari.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PatientAppointmentsCalendar({
  appointments,
  description = "Vezi rapid zilele ocupate si detaliile rezervarilor tale din luna selectata.",
  initialAppointmentId,
  title = "Calendar programari",
}: PatientAppointmentsCalendarProps) {
  const calendarAppointments = useMemo(
    () =>
      appointments.map((appointment) => ({
        ...appointment,
        title: appointment.serviceName,
      })) satisfies CalendarPatientAppointment[],
    [appointments],
  );
  const initialActiveAppointment = initialAppointmentId
    ? calendarAppointments.find(
        (appointment) => appointment.id === initialAppointmentId,
      )
    : null;
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(
    initialActiveAppointment?.id ?? null,
  );
  return (
    <MorphEventsCalendar
      activeEventId={activeAppointmentId}
      countLabel={(count) => `${count} rezervari in cont`}
      description={description}
      events={calendarAppointments}
      initialEventId={initialAppointmentId ?? calendarAppointments[0]?.id ?? null}
      onEventSelect={(appointment) => setActiveAppointmentId(appointment.id)}
      renderActiveEvent={(appointment) => (
        <AppointmentStatusView
          appointment={appointment}
          onBack={() => setActiveAppointmentId(null)}
        />
      )}
      renderSidePanel={({ selectedEvents }) => (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
            Detalii zi selectata
          </p>

          {selectedEvents.length ? (
            <div className="mt-4 space-y-4">
              {selectedEvents.map((appointment) => (
                <button
                  className="group w-full rounded-[1.5rem] border border-[#b1b3a9]/10 bg-white p-4 text-left transition hover:-translate-y-[1px] hover:border-[#ae8462]/20 hover:bg-[#fff7f3] hover:shadow-[0px_12px_24px_rgba(101,77,53,0.08)]"
                  key={appointment.id}
                  onClick={() => setActiveAppointmentId(appointment.id)}
                  type="button"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                        statusTone(appointment.status),
                      )}
                    >
                      {getPortalAppointmentStatusLabel(appointment.status)}
                    </span>
                    <span className="inline-flex rounded-full bg-[#efeee6] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#5e6058]">
                      {getPortalQuestionnaireStatusLabel(
                        appointment.questionnaireStatus,
                      )}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl text-[#31332c]">
                    {appointment.serviceName}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-[#5e6058]">
                    {formatDate(appointment.startAt)}
                    {" - "}
                    {formatTime(appointment.startAt)}
                  </p>

                  {appointment.referenceHint ? (
                    <div className="mt-4 rounded-[1rem] bg-[#f5f4ed] px-3 py-2">
                      <div>
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#797c73]">
                          Cod programare
                        </p>
                        <p className="mt-1 text-sm font-semibold tracking-[0.08em] text-[#31332c]">
                          {appointment.referenceHint}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-[#b1b3a9]/24 bg-white px-4 py-5 text-sm leading-7 text-[#5e6058]">
              Selecteaza o zi cu programari pentru a vedea detaliile consultului.
            </div>
          )}
        </div>
      )}
      title={title}
    />
  );
}
