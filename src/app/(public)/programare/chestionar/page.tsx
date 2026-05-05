import { redirect } from "next/navigation";

import { IntakeQuestionnaire } from "@/components/site/intake-questionnaire";
import { getAppointmentResumeFromCookies } from "@/lib/security/appointment-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAppointmentForAuthenticatedPatient } from "@/modules/appointments/service";
import { getPatientQuestionnaireStatus } from "@/modules/forms/questionnaire";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import sharedStyles from "../page.module.css";

type BookingQuestionnairePageProps = {
  searchParams: Promise<{ appointment?: string }>;
};

export default async function BookingQuestionnairePage({
  searchParams,
}: BookingQuestionnairePageProps) {
  const [{ appointment: requestedAppointmentId }, resumeSession, { user, patient }] =
    await Promise.all([
      searchParams,
      getAppointmentResumeFromCookies(),
      getCurrentPatientAccount(),
    ]);

  const accountAppointment =
    user?.id && requestedAppointmentId
      ? await getAppointmentForAuthenticatedPatient({
          appointmentId: requestedAppointmentId,
          authUserId: user.id,
        })
      : null;
  const appointmentId = accountAppointment?.id ?? resumeSession?.appointmentId ?? null;

  if (!appointmentId) {
    redirect("/programare/status");
  }

  const supabase = createSupabaseAdminClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, patient_id, contact_name, intake_status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) {
    redirect("/programare/status");
  }

  const questionnaireStatus = await getPatientQuestionnaireStatus(
    appointment.patient_id,
  );

  if (
    questionnaireStatus.state === "completed" ||
    appointment.intake_status !== "required_pending"
  ) {
    redirect(
      requestedAppointmentId
        ? `/programare/status?appointment=${appointment.id}`
        : "/programare/status",
    );
  }

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.content}>
        <IntakeQuestionnaire
          appointmentId={appointment.id}
          initialBirthDate={patient?.birth_date ?? null}
          initialName={appointment.contact_name ?? patient?.full_name ?? "Pacient"}
          initialSex={patient?.sex ?? null}
        />
      </div>
    </section>
  );
}
