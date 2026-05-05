"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AssuranceLevel = "aal1" | "aal2" | null;

type AdminMfaGateProps = {
  canElevateToAal2: boolean;
  currentLevel: AssuranceLevel;
  email?: string | null;
};

type TotpSetup = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

type GateStage =
  | "checking"
  | "enroll"
  | "enrolling"
  | "verify"
  | "submitting"
  | "success";

function TotpIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-[#5f5e5e]"
      fill="none"
      viewBox="0 0 40 40"
    >
      <rect
        x="8"
        y="5"
        width="24"
        height="30"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15 13h10M15 19h10M15 25h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="26" cy="28" r="3.2" fill="currentColor" opacity="0.18" />
      <circle cx="26" cy="28" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AdminMfaGate({
  canElevateToAal2,
  currentLevel,
  email,
}: AdminMfaGateProps) {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(
    null,
  );
  const [stage, setStage] = useState<GateStage>("checking");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function syncState() {
      try {
        const supabase = createSupabaseBrowserClient();
        supabaseRef.current = supabase;

        const { data: assurance, error: assuranceError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (assuranceError) {
          throw assuranceError;
        }

        if (assurance.currentLevel === "aal2") {
          setStage("success");
          window.location.assign("/admin");
          return;
        }

        const { data: factors, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          throw factorsError;
        }

        const verifiedTotp = factors.totp[0];

        if (ignore) {
          return;
        }

        if (verifiedTotp) {
          setVerifiedFactorId(verifiedTotp.id);
          setTotpSetup(null);
          setStage("verify");
          return;
        }

        setVerifiedFactorId(null);
        setTotpSetup(null);
        setStage("enroll");
      } catch (caughtError) {
        if (!ignore) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Nu am putut verifica statusul autentificarii MFA.",
          );
          setStage(canElevateToAal2 || currentLevel === "aal1" ? "verify" : "enroll");
        }
      }
    }

    void syncState();

    return () => {
      ignore = true;
    };
  }, [canElevateToAal2, currentLevel]);

  async function handleStartEnrollment() {
    setError(null);
    setStage("enrolling");

    try {
      const supabase = supabaseRef.current ?? createSupabaseBrowserClient();
      supabaseRef.current = supabase;

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const staleUnverifiedTotp = factors.all.filter(
        (factor: { factor_type: string; id: string; status: string }) =>
          factor.factor_type === "totp" && factor.status !== "verified",
      );

      for (const factor of staleUnverifiedTotp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Camelia Admin",
      });

      if (enrollError || !data?.totp?.qr_code || !data.totp.secret || !data.totp.uri) {
        throw enrollError ?? new Error("Configurarea TOTP nu a putut fi initializata.");
      }

      setTotpSetup({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setVerifiedFactorId(null);
      setCode("");
      setStage("verify");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nu am putut initializa configurarea MFA.",
      );
      setStage("enroll");
    }
  }

  async function handleVerify() {
    const factorId = totpSetup?.factorId ?? verifiedFactorId;

    if (!factorId) {
      setError("Nu exista un factor TOTP disponibil pentru verificare.");
      return;
    }

    if (!code.trim()) {
      setError("Introdu codul din aplicatia authenticator.");
      return;
    }

    setError(null);
    setStage("submitting");

    try {
      const supabase = supabaseRef.current ?? createSupabaseBrowserClient();
      supabaseRef.current = supabase;

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      if (challenge.error) {
        throw challenge.error;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });

      if (verify.error) {
        throw verify.error;
      }

      await fetch("/api/admin/mfa/complete", {
        credentials: "same-origin",
        method: "POST",
      });

      setStage("success");
      router.refresh();
      window.location.assign("/admin");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Codul MFA nu a putut fi verificat.",
      );
      setStage("verify");
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", {
      credentials: "same-origin",
      method: "POST",
    });
    window.location.assign("/admin/login");
  }

  const showSetup = stage === "verify" && Boolean(totpSetup);
  const busy = stage === "checking" || stage === "enrolling" || stage === "submitting";

  return (
    <div className="admin-card w-full max-w-3xl overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[#f5f4ed] p-8 sm:p-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0px_14px_28px_rgba(49,51,44,0.08)]">
            <TotpIllustration />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#735a42]">
            Fortress hardening
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#31332c]">
            Verificare MFA pentru admin
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#5e6058]">
            Accesul in panoul de administrare necesita un al doilea factor TOTP.
            Dupa autentificarea Google, confirma codul din aplicatia
            authenticator pentru a obtine sesiunea <span className="font-semibold">aal2</span>.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-[#d8d5cc] bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#735a42]">
              Cont autentificat
            </p>
            <p className="mt-2 text-sm font-semibold text-[#31332c]">
              {email ?? "Administrator"}
            </p>
            <p className="mt-1 text-xs text-[#5e6058]">
              Nivel curent: <span className="font-semibold">{currentLevel ?? "aal1"}</span>
            </p>
            <p className="mt-1 text-xs text-[#5e6058]">
              Daca inchizi aceasta pagina, sesiunile admin fara MFA raman blocate.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="space-y-5">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {stage === "checking" ? (
              <div className="rounded-[1.75rem] border border-[#e1dfd7] bg-[#fbf9f4] p-6">
                <p className="text-sm font-semibold text-[#31332c]">
                  Verificam statusul MFA al sesiunii...
                </p>
              </div>
            ) : null}

            {stage === "enroll" || stage === "enrolling" ? (
              <div className="rounded-[1.75rem] border border-[#e1dfd7] bg-[#fbf9f4] p-6">
                <h2 className="font-serif text-2xl text-[#31332c]">
                  Configureaza autentificatorul
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                  Nu exista inca un factor TOTP verificat pentru acest cont admin.
                  Configureaza acum aplicatia authenticator pentru a continua.
                </p>
                <button
                  className="mt-6 inline-flex rounded-full bg-[#31332c] px-6 py-3 text-sm font-semibold text-[#fff7f3] transition hover:bg-[#0e0e0c] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void handleStartEnrollment()}
                  type="button"
                >
                  {stage === "enrolling" ? "Se configureaza..." : "Configureaza TOTP"}
                </button>
              </div>
            ) : null}

            {stage === "verify" || stage === "submitting" || stage === "success" ? (
              <div className="rounded-[1.75rem] border border-[#e1dfd7] bg-[#fbf9f4] p-6">
                <h2 className="font-serif text-2xl text-[#31332c]">
                  {showSetup ? "Scaneaza codul QR" : "Confirma factorul TOTP"}
                </h2>

                {showSetup ? (
                  <div className="mt-5 space-y-5">
                    <div className="flex justify-center rounded-[1.5rem] border border-[#e1dfd7] bg-white p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Cod QR pentru configurarea MFA"
                        className="h-48 w-48"
                        src={totpSetup?.qrCode}
                      />
                    </div>
                    <div className="rounded-[1.25rem] border border-dashed border-[#d8d5cc] bg-white px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#735a42]">
                        Cheie manuala
                      </p>
                      <p className="mt-2 break-all font-mono text-sm text-[#31332c]">
                        {totpSetup?.secret}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                    Deschide aplicatia authenticator si introdu codul curent cu 6 cifre.
                  </p>
                )}

                <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em] text-[#735a42]">
                  Cod TOTP
                </label>
                <input
                  autoComplete="one-time-code"
                  className="mt-2 w-full rounded-full border border-[#d8d5cc] bg-white px-5 py-3 text-center text-lg tracking-[0.35em] text-[#31332c] outline-none transition focus:border-[#735a42] focus:ring-4 focus:ring-[#ffdcbd]/50"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D+/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  value={code}
                />

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="inline-flex rounded-full bg-[#31332c] px-6 py-3 text-sm font-semibold text-[#fff7f3] transition hover:bg-[#0e0e0c] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void handleVerify()}
                    type="button"
                  >
                    {stage === "submitting" ? "Se verifica..." : "Verifica si intra in admin"}
                  </button>

                  {showSetup ? (
                    <button
                      className="inline-flex rounded-full border border-[#d8d5cc] px-6 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-white"
                      disabled={busy}
                      onClick={() => void handleStartEnrollment()}
                      type="button"
                    >
                      Genereaza alt cod QR
                    </button>
                  ) : null}
                </div>

                {stage === "success" ? (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">
                    Verificarea a reusit. Redirectionam catre panoul admin...
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              className="text-sm font-semibold text-[#735a42] transition hover:text-[#5f5e5e]"
              onClick={() => void handleSignOut()}
              type="button"
            >
              Deconecteaza acest cont
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
