"use client";

import { useState } from "react";

type AppointmentStatusLookupProps = {
  initialEmail?: string | null;
};

export function AppointmentStatusLookup({
  initialEmail,
}: AppointmentStatusLookupProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [state, setState] = useState<{
    type: "idle" | "loading" | "error";
    message?: string;
  }>({ type: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("code", code);

    setState({ type: "loading" });
    const response = await fetch("/api/appointments/lookup", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      resumeUrl?: string;
    };

    if (!response.ok || !payload.ok) {
      setState({
        type: "error",
        message:
          payload.error ??
          "Nu am putut verifica programarea pe baza emailului si a codului.",
      });
      return;
    }

    window.location.assign(payload.resumeUrl ?? "/programare/status");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#4b4a45]" htmlFor="lookup-email">
          Email
        </label>
        <input
          id="lookup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[1.4rem] border border-[#dfd8cd] bg-white px-4 py-3 text-[#22241f] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
          placeholder="nume@exemplu.ro"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#4b4a45]" htmlFor="lookup-code">
          Cod de verificare
        </label>
        <input
          id="lookup-code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full rounded-[1.4rem] border border-[#dfd8cd] bg-white px-4 py-3 text-[#22241f] uppercase tracking-[0.18em] outline-none transition focus:border-[#7c6651] focus:ring-4 focus:ring-[#efe5d8]"
          placeholder="ABCD-EFGH"
          required
        />
      </div>

      {state.type === "error" ? (
        <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={state.type === "loading"}
        className="inline-flex items-center justify-center rounded-full bg-[#252c28] px-6 py-3 text-sm font-semibold text-[#fff8f1] transition hover:bg-[#1d221f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.type === "loading" ? "Se verifica..." : "Verifica programarea"}
      </button>
    </form>
  );
}
