import Link from "next/link";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PatientAuthShell } from "@/components/auth/patient-auth-shell";
import styles from "@/components/auth/patient-auth.module.css";

type PatientLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    redirectTo?: string;
    email?: string;
  }>;
};

export default async function PatientLoginPage({
  searchParams,
}: PatientLoginPageProps) {
  const params = await searchParams;

  return (
    <PatientAuthShell
      eyebrow="Cont pacient"
      title="Bine ai revenit"
      description="Intra in contul tau pentru a pastra datele profilului si a rezerva mai rapid urmatoarele programari."
      cardTitle="Autentificare"
      cardDescription="Foloseste adresa de email cu care ai creat contul de pacient."
      error={params.error}
      success={params.success}
      notesPosition="below"
      notes={
        <div className={styles.noteGrid}>
          <p className={styles.noteCard}>
            Emailul confirmat ramane sursa principala pentru identificarea profilului.
          </p>
          <p className={styles.noteCard}>
            Programarile ca turist raman disponibile si dupa ce iti creezi cont.
          </p>
          <p className={styles.noteCard}>
            Poti completa datele profilului si poti rezerva direct din cont.
          </p>
        </div>
      }
      footer={
        <p className={styles.footerText}>
          Nu ai cont?{" "}
          <Link
            href={`/cont/inregistrare?redirectTo=${encodeURIComponent(
              params.redirectTo ?? "/cont/dashboard",
            )}${params.email ? `&email=${encodeURIComponent(params.email)}` : ""}`}
            className={styles.footerLink}
          >
            Creeaza profilul tau
          </Link>
        </p>
      }
    >
      <div className={styles.oauthStack}>
        <GoogleAuthButton
          label="Continua cu Google"
          redirectTo={params.redirectTo ?? "/cont/dashboard"}
          className={styles.googleButton}
        />
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>sau</span>
          <span className={styles.dividerLine} />
        </div>
      </div>

      <form action="/api/auth/login" className={styles.form} method="post">
        <input
          type="hidden"
          name="redirectTo"
          value={params.redirectTo ?? "/cont/dashboard"}
        />
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            className={styles.input}
            defaultValue={params.email ?? ""}
            placeholder="nume@exemplu.ro"
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-password">
            Parola
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            className={styles.input}
            placeholder="********"
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Autentificare
        </button>
      </form>
    </PatientAuthShell>
  );
}
