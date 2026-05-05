import Link from "next/link";

import { AppointmentStatusLookup } from "@/components/site/appointment-status-lookup";
import { getAppointmentResumeFromCookies } from "@/lib/security/appointment-session";
import { getAppointmentForAuthenticatedPatient, getPublicAppointmentSummaryById } from "@/modules/appointments/service";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import sharedStyles from "../page.module.css";
import styles from "./page.module.css";

type BookingStatusPageProps = {
  searchParams: Promise<{
    appointment?: string;
    lookup?: string;
  }>;
};

export default async function BookingStatusPage({
  searchParams,
}: BookingStatusPageProps) {
  const [
    { appointment: requestedAppointmentId, lookup },
    resumeSession,
    { user, patient },
  ] =
    await Promise.all([
      searchParams,
      getAppointmentResumeFromCookies(),
      getCurrentPatientAccount(),
    ]);
  const forceLookup = lookup === "1" || lookup === "true";

  const accountAppointment =
    user?.id && requestedAppointmentId
      ? await getAppointmentForAuthenticatedPatient({
          appointmentId: requestedAppointmentId,
          authUserId: user.id,
        })
      : null;
  const appointmentId = accountAppointment?.id ?? resumeSession?.appointmentId ?? null;
  const appointment = appointmentId
    ? await getPublicAppointmentSummaryById(appointmentId).catch(() => null)
    : null;
  const fallbackEmail = patient?.email ?? user?.email ?? null;
  const showLookup = forceLookup || !appointment;

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.content}>
        <div className={`${styles.section} ${styles.card}`}>
          {showLookup ? (
            <>
              <p className={styles.eyebrow}>Reluare programare</p>
              <h1 className={styles.title}>
                {appointment ? "Verifica alta rezervare" : "Verifica rezervarea ta"}
              </h1>
              <p className={styles.description}>
                Introdu emailul si codul primit la rezervare. Daca ai inchis pagina dupa booking
                sau vrei sa verifici alta programare, de aici poti vedea statusul programarii si
                poti continua Chestionarul Evaluare Nutritionala atunci cand este necesar.
              </p>
              <div className="mt-8">
                <AppointmentStatusLookup initialEmail={fallbackEmail} />
              </div>
              {appointment ? (
                <div className={styles.actions}>
                  <Link className={styles.secondaryButton} href="/programare/status">
                    Inapoi la programarea curenta
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className={styles.eyebrow}>Programarea ta</p>
              <h1 className={styles.title}>{appointment.statusLabel}</h1>
              <p className={styles.description}>
                Iti poti verifica de aici stadiul programarii si, daca este prima vizita, poti
                continua Chestionarul Evaluare Nutritionala exact de unde ai ramas.
              </p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Serviciu</div>
                  <div className={styles.statValue}>{appointment.serviceName}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Data si ora</div>
                  <div className={styles.statValue}>
                    {new Date(appointment.startAt).toLocaleString("ro-RO")}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Email booking</div>
                  <div className={styles.statValue}>{appointment.email ?? "—"}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Cod referinta</div>
                  <div className={styles.statValue}>
                    {appointment.publicReferenceHint ?? "—"}
                  </div>
                </div>
              </div>

              {appointment.questionnaireStatus === "required" ? (
                <div className={`${styles.notice} ${styles.noticePending}`}>
                  <div className={styles.noticeLead}>
                    <span className={styles.noticeIcon} aria-hidden="true">
                      !
                    </span>
                    <div className={styles.noticeCopy}>
                      <h2 className={styles.noticeTitle}>
                        Este o prima vizita si Chestionarul Evaluare Nutritionala nu este inca
                        finalizat.
                      </h2>
                      <p className={styles.noticeText}>
                        Slotul a ramas blocat pentru tine. Completeaza chestionarul ca sa fie
                        totul pregatit.
                      </p>
                    </div>
                  </div>
                  <Link className={styles.noticeButton} href="/programare/chestionar">
                    Completeaza chestionarul
                    <span className={styles.noticeButtonArrow} aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              ) : null}

              {appointment.questionnaireStatus === "on_file" ? (
                <div className={`${styles.notice} ${styles.noticeSuccess}`}>
                  Chestionarul Evaluare Nutritionala este deja disponibil in profilul tau. Nu mai
                  este nevoie sa il completezi din nou pentru aceasta programare.
                </div>
              ) : null}

              {appointment.questionnaireStatus === "submitted_for_appointment" ? (
                <div className={`${styles.notice} ${styles.noticeSuccess}`}>
                  Chestionarul Evaluare Nutritionala a fost trimis. Totul este pregatit pentru
                  consultatie.
                </div>
              ) : null}

              <div className={styles.actions}>
                <Link className={styles.secondaryButton} href="/programare/status?lookup=1">
                  Verifica alta programare
                </Link>
                {user ? (
                  <Link className={styles.secondaryButton} href="/cont/dashboard">
                    Deschide panoul pacientului
                  </Link>
                ) : null}
                {!user && appointment.email ? (
                  <Link
                    className={styles.secondaryButton}
                    href={`/cont/inregistrare?redirectTo=/cont/dashboard&email=${encodeURIComponent(
                      appointment.email,
                    )}`}
                  >
                    Creeaza contul tau
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
