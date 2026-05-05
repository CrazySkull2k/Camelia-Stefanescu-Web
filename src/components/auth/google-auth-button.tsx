"use client";

import { useState } from "react";

import styles from "./google-auth-button.module.css";

type GoogleAuthButtonProps = {
  redirectTo: string;
  label: string;
  tone?: "login" | "register";
  className?: string;
};

export function GoogleAuthButton({
  redirectTo,
  label,
  tone = "login",
  className,
}: GoogleAuthButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/google", {
        body: JSON.stringify({ redirectTo }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean; url?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.url) {
        throw new Error(
          payload?.error ?? "Nu am putut initializa autentificarea Google.",
        );
      }

      window.location.assign(payload.url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nu am putut initializa autentificarea Google.";
      const loginUrl = new URL(
        redirectTo.startsWith("/admin")
          ? "/admin/login"
          : "/cont/autentificare",
        window.location.origin,
      );

      loginUrl.searchParams.set("error", message);

      if (!redirectTo.startsWith("/admin")) {
        loginUrl.searchParams.set("redirectTo", redirectTo);
      }

      window.location.assign(loginUrl.toString());
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className={`${styles.button} inline-flex w-full items-center justify-center gap-3 transition disabled:cursor-not-allowed disabled:opacity-70 ${
        className ??
        (tone === "register"
          ? "rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-900 hover:border-amber-300 hover:bg-amber-100"
          : "rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50")
      }`}
    >
      <span className={styles.content}>
        <svg
          aria-hidden="true"
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 12.9975 12.9232 12.0443 13.5614V15.8195H14.9523C16.6541 14.2527 17.64 11.9455 17.64 9.20455Z"
            fill="#4285F4"
          />
          <path
            d="M9 18C11.43 18 13.4673 17.1941 14.9523 15.8195L12.0443 13.5614C11.2384 14.1014 10.2082 14.4205 9 14.4205C6.65591 14.4205 4.6725 12.8373 3.96409 10.71H0.957275V13.0418C2.43409 15.975 5.46955 18 9 18Z"
            fill="#34A853"
          />
          <path
            d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.57955C10.3186 3.57955 11.5036 4.03364 12.435 4.92409L15.0177 2.34136C13.4632 0.889091 11.4259 0 9 0C5.46955 0 2.43409 2.025 0.957275 4.95818L3.96409 7.29C4.6725 5.16273 6.65591 3.57955 9 3.57955Z"
            fill="#EA4335"
          />
        </svg>
        <span className={styles.label}>
          {pending ? "Se redirectioneaza..." : label}
        </span>
      </span>
    </button>
  );
}
