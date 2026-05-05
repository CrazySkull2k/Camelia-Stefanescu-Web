import type { ReactNode } from "react";

import styles from "./patient-auth.module.css";

type PatientAuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  error?: string;
  success?: string;
  notes?: ReactNode;
  notesPosition?: "above" | "below";
  children: ReactNode;
  footer: ReactNode;
};

export function PatientAuthShell({
  eyebrow,
  title,
  description,
  cardTitle,
  cardDescription,
  error,
  success,
  notes,
  notesPosition = "above",
  children,
  footer,
}: PatientAuthShellProps) {
  return (
    <section className={styles.shell}>
      <div className={styles.accentOne} />
      <div className={styles.accentTwo} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroDescription}>{description}</p>
      </div>

      {notes && notesPosition === "above" ? (
        <div className={styles.notes}>{notes}</div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{cardTitle}</h2>
          <p className={styles.cardDescription}>{cardDescription}</p>
        </div>

        {error ? (
          <div className={`${styles.status} ${styles.statusError}`}>{error}</div>
        ) : null}
        {success ? (
          <div className={`${styles.status} ${styles.statusSuccess}`}>
            {success}
          </div>
        ) : null}

        <div className={styles.formArea}>{children}</div>
        <div className={styles.cardFooter}>{footer}</div>
      </div>

      {notes && notesPosition === "below" ? (
        <div className={`${styles.notes} ${styles.notesBelow}`}>{notes}</div>
      ) : null}
    </section>
  );
}
