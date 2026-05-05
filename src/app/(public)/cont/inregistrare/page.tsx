import Link from "next/link";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PatientAuthShell } from "@/components/auth/patient-auth-shell";
import styles from "@/components/auth/patient-auth.module.css";

type PatientRegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    redirectTo?: string;
    email?: string;
  }>;
};

export default async function PatientRegisterPage({
  searchParams,
}: PatientRegisterPageProps) {
  const params = await searchParams;

  return (
    <PatientAuthShell
      eyebrow="Profil nou"
      title="Creeaza-ti contul"
      description="Dupa confirmarea emailului, contul tau va putea fi asociat automat cu programarile facute anterior cu acelasi email verificat."
      cardTitle="Inregistrare"
      cardDescription="Foloseste un email pe care il poti confirma imediat."
      error={params.error}
      success={params.success}
      notes={
        <div className={styles.noteGrid}>
          <p className={styles.noteCard}>
            Dupa inregistrare, vei primi un email de confirmare. Abia dupa confirmare activam profilul de pacient si legatura cu datele salvate.
          </p>
        </div>
      }
      footer={
        <p className={styles.footerText}>
          Ai deja cont?{" "}
          <Link
            href={`/cont/autentificare?redirectTo=${encodeURIComponent(
              params.redirectTo ?? "/cont/dashboard",
            )}${params.email ? `&email=${encodeURIComponent(params.email)}` : ""}`}
            className={styles.footerLink}
          >
            Autentifica-te
          </Link>
        </p>
      }
    >
      <div className={styles.oauthStack}>
        <GoogleAuthButton
          label="Continua cu Google"
          redirectTo={params.redirectTo ?? "/cont/dashboard"}
          tone="register"
          className={styles.googleButton}
        />
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>sau</span>
          <span className={styles.dividerLine} />
        </div>
      </div>

      <form action="/api/auth/register" className={styles.form} method="post">
        <input
          type="hidden"
          name="redirectTo"
          value={params.redirectTo ?? "/cont/dashboard"}
        />
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-full-name">
            Nume complet
          </label>
          <input
            id="register-full-name"
            name="full_name"
            type="text"
            className={styles.input}
            placeholder="Nume si prenume"
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            className={styles.input}
            defaultValue={params.email ?? ""}
            placeholder="nume@exemplu.ro"
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-password">
            Parola
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            minLength={8}
            className={styles.input}
            placeholder="Minimum 8 caractere"
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Creeaza contul
        </button>
      </form>
    </PatientAuthShell>
  );
}
