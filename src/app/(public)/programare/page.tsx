import Link from "next/link";
import { cookies, headers } from "next/headers";

import { AppointmentBooking } from "@/components/site/appointment-booking";
import { BOOKING_MODE_COOKIE } from "@/lib/security/appointment-session";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import { getServiceOfferings } from "@/modules/pricing/service";
import styles from "./page.module.css";

type BookingPageProps = {
  searchParams: Promise<{
    service?: string | string[];
  }>;
};

export default async function BookingPage(props: BookingPageProps) {
  const [{ user, patient }, services, searchParams, cookieStore, requestHeaders] = await Promise.all([
    getCurrentPatientAccount(),
    getServiceOfferings(),
    props.searchParams,
    cookies(),
    headers(),
  ]);
  const requestedService = Array.isArray(searchParams.service)
    ? searchParams.service[0]
    : searchParams.service;
  const cookieMode = cookieStore.get(BOOKING_MODE_COOKIE)?.value;
  const initialBookingMode =
    user?.email
      ? "account"
      : cookieMode === "account" || cookieMode === "guest"
        ? cookieMode
        : "guest";

  const patientSnapshot = patient
    ? {
        fullName: patient.full_name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birth_date,
        sex: patient.sex,
      }
    : null;
  const bookingKey = [
    user?.id ?? "guest",
    requestedService ?? "",
    patient?.full_name ?? "",
    patient?.phone ?? "",
    patient?.birth_date ?? "",
    patient?.sex ?? "",
  ].join(":");

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Programare online</p>
          <h1 className={styles.title}>Rezerva consultatia potrivita</h1>
          <p className={styles.description}>
            Alege serviciul, data si ora. Poti face programarea rapid ca turist
            sau, daca esti autentificat, formularul foloseste automat datele
            salvate in profilul tau de pacient.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.statusLink} href="/programare/status">
              Ai deja programare? Verifica status aici
            </Link>
          </div>
        </div>

        <AppointmentBooking
          key={bookingKey}
          services={services}
          nonce={requestHeaders.get("x-nonce")}
          patient={patientSnapshot}
          initialBookingMode={initialBookingMode}
          userEmail={user?.email ?? null}
          initialServiceSlug={requestedService ?? null}
          title="Rezerva consultatia potrivita"
          description="Alege serviciul, data si ora. Daca esti autentificat, formularul foloseste profilul tau pentru programarile viitoare."
          variant="editorial"
        />
      </div>
    </section>
  );
}
