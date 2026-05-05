import Link from "next/link";
import { redirect } from "next/navigation";

import { getPatientQuestionnaireStatus } from "@/modules/forms/questionnaire";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import { listPatientPortalAppointments } from "@/modules/patients/portal";

type PatientProfilePageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function PatientProfilePage({
  searchParams,
}: PatientProfilePageProps) {
  const params = await searchParams;
  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    redirect("/cont/autentificare?redirectTo=/cont/profil");
  }

  const [questionnaireStatus, appointments] = await Promise.all([
    getPatientQuestionnaireStatus(patient.id),
    listPatientPortalAppointments({ patientId: patient.id, limit: 12 }),
  ]);
  const activeAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "pending" || appointment.status === "confirmed",
  ).length;

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
          Profil pacient
        </p>
        <h1 className="mt-4 font-serif text-5xl text-[#31332c]">
          Datele tale personale
        </h1>
        <p className="mt-4 text-base leading-8 text-[#5e6058]">
          Aceste date sunt folosite pentru precompletarea programarilor si
          pentru asocierea Evaluarii Nutritionale la profilul tau.
        </p>

        <div className="mt-8 space-y-4 rounded-[1.75rem] bg-[#f5f4ed] p-5 text-sm text-[#5e6058]">
          <div>
            <p className="font-semibold text-[#31332c]">Email confirmat</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="font-semibold text-[#31332c]">Programari active</p>
            <p>{activeAppointments}</p>
          </div>
          <div>
            <p className="font-semibold text-[#31332c]">
              Evaluare Nutritionala
            </p>
            <p>
              {questionnaireStatus.state === "completed"
                ? "Disponibil in profil"
                : questionnaireStatus.state === "outdated"
                  ? "Versiune mai veche in istoric"
                  : "Nu a fost completat"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-[#5f5e5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#535252]"
            href="/cont/dashboard"
          >
            Inapoi la dashboard
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-5 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
            href="/programare"
          >
            Rezerva o consultatie
          </Link>
        </div>
      </aside>

      <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <h2 className="font-serif text-3xl text-[#31332c]">Actualizeaza profilul</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5e6058]">
          Pastreaza-ti datele sincronizate pentru programarile viitoare si
          pentru documentele din contul tau.
        </p>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}

        {params.success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {params.success}
          </div>
        ) : null}

        <form action="/api/account/profile" className="mt-8 grid gap-5 md:grid-cols-2" method="post">
          <div className="md:col-span-2">
            <label
              className="mb-2 block text-sm font-medium text-[#5e6058]"
              htmlFor="patient-full-name"
            >
              Nume complet
            </label>
            <input
              id="patient-full-name"
              name="full_name"
              type="text"
              defaultValue={patient.full_name ?? ""}
              className="w-full rounded-2xl border border-[#e2e3d9] bg-white px-4 py-3 text-[#31332c] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
              required
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#5e6058]"
              htmlFor="patient-email"
            >
              Email
            </label>
            <input
              id="patient-email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full rounded-2xl border border-[#e2e3d9] bg-[#f5f4ed] px-4 py-3 text-[#797c73]"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#5e6058]"
              htmlFor="patient-phone"
            >
              Telefon
            </label>
            <input
              id="patient-phone"
              name="phone"
              type="tel"
              defaultValue={patient.phone ?? ""}
              className="w-full rounded-2xl border border-[#e2e3d9] bg-white px-4 py-3 text-[#31332c] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#5e6058]"
              htmlFor="patient-birth-date"
            >
              Data nasterii
            </label>
            <input
              id="patient-birth-date"
              name="birth_date"
              type="date"
              defaultValue={patient.birth_date ?? ""}
              className="w-full rounded-2xl border border-[#e2e3d9] bg-white px-4 py-3 text-[#31332c] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-[#5e6058]"
              htmlFor="patient-sex"
            >
              Sex
            </label>
            <select
              id="patient-sex"
              name="sex"
              defaultValue={patient.sex ?? ""}
              className="w-full rounded-2xl border border-[#e2e3d9] bg-white px-4 py-3 text-[#31332c] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
            >
              <option value="">Selecteaza</option>
              <option value="F">Feminin</option>
              <option value="M">Masculin</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#5f5e5e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#535252]"
            >
              Salveaza profilul
            </button>
            <Link
              href="/cont/chestionar"
              className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-6 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
            >
              Vezi evaluarea
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
