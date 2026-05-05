import Link from "next/link";
import { redirect } from "next/navigation";

import { PatientQuestionnairePdfDownloads } from "@/components/site/patient-questionnaire-pdf-downloads";
import { PatientQuestionnaireView } from "@/components/site/patient-questionnaire-view";
import {
  getPatientQuestionnaireStatus,
  getPatientQuestionnaireSubmissionDetail,
} from "@/modules/forms/questionnaire";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import {
  getPortalQuestionnaireStatusLabel,
  listPatientPortalAppointments,
  listPatientQuestionnaireHistory,
} from "@/modules/patients/portal";

type PatientQuestionnairePageProps = {
  searchParams: Promise<{
    submission?: string | string[] | undefined;
  }>;
};

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" && value.trim().length ? value : null;
}

export default async function PatientQuestionnairePage({
  searchParams,
}: PatientQuestionnairePageProps) {
  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    redirect("/cont/autentificare?redirectTo=/cont/chestionar");
  }

  const query = await searchParams;
  const requestedSubmissionId = normalizeSearchParam(query.submission);

  const [questionnaireStatus, appointments, history, selectedSubmission] = await Promise.all([
    getPatientQuestionnaireStatus(patient.id),
    listPatientPortalAppointments({ patientId: patient.id, limit: 12 }),
    listPatientQuestionnaireHistory(patient.id),
    getPatientQuestionnaireSubmissionDetail({
      patientId: patient.id,
      submissionId: requestedSubmissionId,
    }),
  ]);

  const questionnaireAppointment = appointments.find(
    (appointment) => appointment.questionnaireStatus === "required",
  );
  const selectedHistoryId = selectedSubmission?.id ?? questionnaireStatus.latestSubmissionId;
  const isSelectedSubmissionOutdated = Boolean(
    selectedSubmission?.versionId &&
      questionnaireStatus.currentVersionId &&
      selectedSubmission.versionId !== questionnaireStatus.currentVersionId,
  );
  const latestCompletionLabel = questionnaireStatus.completedAt
    ? new Date(questionnaireStatus.completedAt).toLocaleString("ro-RO")
    : "Nu exista";
  const selectedCompletionLabel =
    selectedSubmission &&
    selectedSubmission.id !== questionnaireStatus.latestSubmissionId
      ? new Date(selectedSubmission.submittedAt).toLocaleString("ro-RO")
      : null;

  return (
    <section className="space-y-8">
      <header className="rounded-[2.25rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
          Dosar
        </p>
        <h1 className="mt-4 font-serif text-5xl text-[#31332c]">
          Evaluare Nutritionala
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5e6058]">
          Consulta raspunsurile salvate in profil si descarca oricand o copie
          noua, in varianta stilizata sau simpla.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                Status curent
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#31332c]">
                {questionnaireStatus.state === "completed"
                  ? "Disponibil in profil"
                  : questionnaireStatus.state === "outdated"
                    ? "Versiune mai veche in istoric"
                    : "Nu a fost completat"}
              </h2>
            </div>
            <span className="inline-flex rounded-full bg-[#f9f3ea] px-4 py-2 text-xs font-semibold text-[#654d35]">
              {getPortalQuestionnaireStatusLabel(
                questionnaireStatus.state === "completed"
                  ? "on_file"
                  : questionnaireStatus.state === "missing"
                    ? "required"
                    : "required",
              )}
            </span>
          </div>

          <div
            className={`mt-8 grid gap-4 ${
              selectedCompletionLabel ? "md:grid-cols-2" : "md:grid-cols-1"
            }`}
          >
            <div className="rounded-[1.6rem] bg-[#f5f4ed] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                Ultima completare
              </p>
              <p className="mt-2 text-lg font-semibold text-[#31332c]">
                {latestCompletionLabel}
              </p>
            </div>
            {selectedCompletionLabel ? (
              <div className="rounded-[1.6rem] bg-[#fff7f3] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4332]">
                  Completare afisata
                </p>
                <p className="mt-2 text-lg font-semibold text-[#31332c]">
                  {selectedCompletionLabel}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 text-sm leading-7 text-[#5e6058]">
            {questionnaireStatus.state === "completed"
              ? "Evaluarea nutritionala este disponibila in profil si poate fi descarcata in varianta stilizata sau simpla."
              : questionnaireStatus.state === "outdated"
                ? "Ai o versiune mai veche in istoric. O poti consulta aici si poti exporta o copie noua din submission-ul selectat."
                : "Evaluarea nutritionala nu este inca disponibila in profil. O poti completa atunci cand o programare o cere."}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {selectedSubmission ? (
              <PatientQuestionnairePdfDownloads submissionId={selectedSubmission.id} />
            ) : null}
            {questionnaireAppointment ? (
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-6 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
                href={`/programare/chestionar?appointment=${questionnaireAppointment.id}`}
              >
                Continua evaluarea
              </Link>
            ) : (
              <Link
                className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-6 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
                href="/programare"
              >
                Rezerva o consultatie
              </Link>
            )}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#f5f4ed] p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <h2 className="font-serif text-3xl text-[#31332c]">
            Istoric recent
          </h2>
          <div className="mt-6 space-y-4">
            {history.length ? (
              history.map((item) => (
                <Link
                  key={item.id}
                  className={`block rounded-[1.5rem] border p-4 transition ${
                    item.id === selectedHistoryId
                      ? "border-[#b76e5b]/25 bg-[#fff7f3] shadow-[0px_10px_28px_rgba(49,51,44,0.08)]"
                      : "border-white/60 bg-white hover:border-[#b1b3a9]/25 hover:bg-[#fffaf6]"
                  }`}
                  href={`/cont/chestionar?submission=${item.id}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                    {item.versionId}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#31332c]">
                    {new Date(item.submittedAt).toLocaleString("ro-RO")}
                  </p>
                  {item.id === selectedHistoryId ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a4332]">
                      Completare afisata
                    </p>
                  ) : null}
                </Link>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[#b1b3a9]/30 bg-white px-4 py-4 text-sm text-[#5e6058]">
                Nu exista completari anterioare pentru evaluarea nutritionala.
              </div>
            )}
          </div>
        </aside>
      </div>

      {selectedSubmission ? (
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                  Evaluare completata
                </p>
                <h2 className="mt-3 font-serif text-4xl text-[#31332c]">
                  Completare selectata
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5e6058]">
                  Vizualizezi raspunsurile trimise la{" "}
                  {new Date(selectedSubmission.submittedAt).toLocaleString("ro-RO")}
                  . Continutul de mai jos ramane disponibil direct in profil, fara sa fie nevoie
                  sa deschizi un PDF separat.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isSelectedSubmissionOutdated ? (
                  <span className="inline-flex rounded-full bg-[#fff1de] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6734]">
                    Versiune din istoric
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <PatientQuestionnaireView model={selectedSubmission.model} />
        </section>
      ) : null}
    </section>
  );
}
