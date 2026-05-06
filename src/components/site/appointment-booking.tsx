"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

import { getTurnstileSiteKey } from "@/lib/env/client";
import { AppointmentBookingEditorial } from "@/components/site/appointment-booking-editorial";

type BookableService = {
  title: string;
  slug: string;
  categoryKey: string;
  durationMinutes?: number;
  priceLabel: string;
  visible: boolean;
  bookable: boolean;
};

type PatientSnapshot = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  sex?: string | null;
};

type AppointmentBookingProps = {
  services: BookableService[];
  patient?: PatientSnapshot | null;
  userEmail?: string | null;
  nonce?: string | null;
  initialBookingMode?: "guest" | "account";
  initialServiceSlug?: string | null;
  title?: string;
  description?: string;
  variant?: "default" | "compact" | "legacy" | "editorial";
};

type Slot = {
  time: string;
  taken: boolean;
};

declare global {
  interface Window {
    onCameliaTurnstileSuccess?: (token: string) => void;
  }
}

function persistBookingModePreference(mode: "guest" | "account") {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `booking_mode=${mode}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${secureFlag}`;
}

function resolveServiceSlug(
  services: BookableService[],
  requestedService?: string | null,
) {
  if (!services.length) {
    return "";
  }

  if (requestedService) {
    const match =
      services.find((service) => service.slug === requestedService) ??
      services.find((service) => service.title === requestedService);

    if (match) {
      return match.slug;
    }
  }

  return services[0]?.slug ?? "";
}

export function AppointmentBooking({
  services,
  patient,
  userEmail,
  nonce,
  initialBookingMode = "guest",
  initialServiceSlug,
  title = "Rezerva o programare",
  description = "Alege serviciul, data si intervalul potrivit. Daca ai cont, datele tale raman salvate pentru programarile viitoare.",
  variant = "default",
}: AppointmentBookingProps) {
  const availableServices = services.filter((service) => service.visible && service.bookable);
  const turnstileSiteKey = getTurnstileSiteKey();
  const [name, setName] = useState(patient?.fullName ?? "");
  const [email, setEmail] = useState(userEmail ?? patient?.email ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [service, setService] = useState(() =>
    resolveServiceSlug(availableServices, initialServiceSlug),
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [firstVisit, setFirstVisit] = useState<"Da" | "Nu">("Da");
  const [bookingMode, setBookingMode] = useState<"guest" | "account">(
    userEmail ? "account" : initialBookingMode,
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsState, setSlotsState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [submitState, setSubmitState] = useState<{
    type: "idle" | "loading" | "error" | "success";
    message?: string;
  }>({ type: "idle" });
  const legacy = variant === "legacy";
  const editorial = variant === "editorial";
  const compact = variant === "compact";

  function handleBookingModeChange(mode: "guest" | "account") {
    setBookingMode(mode);
    persistBookingModePreference(mode);
  }

  useEffect(() => {
    window.onCameliaTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    return () => {
      delete window.onCameliaTurnstileSuccess;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!date || !service) {
        setSlots([]);
        setSlotsState("idle");
        setTime("");
        return;
      }

      setSlotsState("loading");
      try {
        const response = await fetch(
          `/api/appointments?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service)}`,
        );
        const payload = (await response.json()) as Slot[] | { error?: string };

        if (!response.ok || !Array.isArray(payload)) {
          if (!ignore) {
            setSlots([]);
            setSlotsState("error");
          }
          return;
        }

        if (!ignore) {
          setSlots(payload);
          setSlotsState("ready");
          setTime((currentTime) =>
            payload.some((slot) => !slot.taken && slot.time === currentTime) ? currentTime : "",
          );
        }
      } catch {
        if (!ignore) {
          setSlots([]);
          setSlotsState("error");
        }
      }
    }

    void loadSlots();

    return () => {
      ignore = true;
    };
  }, [date, service]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (bookingMode === "account" && !userEmail) {
      setSubmitState({
        type: "error",
        message:
          "Alege autentificarea in cont sau continua fara cont pentru a finaliza programarea.",
      });
      return;
    }

    if (!date) {
      setSubmitState({
        type: "error",
        message: "Selecteaza o data pentru programare.",
      });
      return;
    }

    if (!time) {
      setSubmitState({
        type: "error",
        message: "Selecteaza un interval disponibil.",
      });
      return;
    }

    setSubmitState({ type: "loading" });
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("service", service);
    formData.append("date", date);
    formData.append("time", time);
    formData.append("prima_vizita", firstVisit);
    formData.append("turnstileToken", turnstileToken);
    formData.append("website", "");

    const response = await fetch("/api/appointments", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      appointmentId?: string;
      status?: "pending" | "confirmed" | "cancelled" | "completed";
      requiresIntake?: boolean;
      resumeUrl?: string;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.appointmentId) {
      setSubmitState({
        type: "error",
        message: payload.error ?? "Nu am putut salva programarea.",
      });
      return;
    }

    const statusCopy =
      payload.status === "pending" ? "Cererea a fost primita si slotul a fost blocat." : "Programarea a fost salvata si slotul a fost blocat.";

    setSubmitState({
      type: "success",
      message: payload.requiresIntake
        ? `${statusCopy} Te redirectionam spre pagina de status, unde poti continua Chestionarul Evaluare Nutritionala.`
        : `${statusCopy} Te redirectionam spre pagina de status.`,
    });
    window.setTimeout(() => {
      window.location.assign(payload.resumeUrl ?? "/programare/status");
    }, 250);
  }

  if (legacy) {
    return (
      <div className="consultation_form bg_primary_light decoration_wrapper">
        <div className="section_heading text-center">
          <h2 className="section_heading_text mb-0">
            <span className="d-md-block">{title}</span>
          </h2>
          <br />
          <p>{description}</p>
          <br />
        </div>

        {userEmail ? (
          <div className="container mb-4">
            <div className="alert alert-light text-center">
              Esti autentificat ca <strong>{userEmail}</strong>.{" "}
              <Link href="/cont/profil">Actualizeaza profilul pacientului</Link>.
            </div>
          </div>
        ) : (
          <div className="container mb-4">
            <div className="alert alert-light text-center">
              Poti rezerva ca turist sau iti poti{" "}
              <Link href="/cont/inregistrare">crea un cont pacient</Link> pentru
              a salva datele programarilor viitoare.
            </div>
          </div>
        )}

        {submitState.message ? (
          <div className="container mb-4">
            <div
              className={`alert ${
                submitState.type === "error" ? "alert-danger" : "alert-success"
              }`}
            >
              {submitState.message}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="row justify-content-center">
          <div className="col-lg-7">
            <div className="row mt-[-4rem]">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="booking-name-legacy">Nume</label>
                  <input
                    id="booking-name-legacy"
                    type="text"
                    className="form-control"
                    placeholder="Numele tau"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="booking-phone-legacy">Telefon</label>
                  <input
                    id="booking-phone-legacy"
                    type="tel"
                    className="form-control"
                    placeholder="07.."
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="booking-email-legacy">Email</label>
                  <input
                    id="booking-email-legacy"
                    type="email"
                    className="form-control"
                    placeholder="email@exemplu.ro"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={Boolean(userEmail)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="booking-service-legacy">Categorie</label>
                  <select
                    id="booking-service-legacy"
                    className="form-select"
                    value={service}
                    onChange={(event) => setService(event.target.value)}
                    required
                  >
                    {availableServices.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="booking-date-legacy">Data</label>
                  <input
                    id="booking-date-legacy"
                    type="date"
                    className="form-control"
                    min={new Date().toISOString().slice(0, 10)}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label d-block mb-2">Este prima vizita?</label>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input ms-0"
                    type="radio"
                    id="prima_vizita_da"
                    checked={firstVisit === "Da"}
                    onChange={() => setFirstVisit("Da")}
                  />
                  <label className="form-check-label" htmlFor="prima_vizita_da">
                    Da
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input ms-0"
                    type="radio"
                    id="prima_vizita_nu"
                    checked={firstVisit === "Nu"}
                    onChange={() => setFirstVisit("Nu")}
                  />
                  <label className="form-check-label" htmlFor="prima_vizita_nu">
                    Nu
                  </label>
                </div>
              </div>

              <div className="col-md-12">
                <label>Ore disponibile</label>
                {slotsState === "error" ? (
                  <div className="alert alert-danger mt-2">
                    Nu am putut incarca intervalele disponibile pentru aceasta zi.
                  </div>
                ) : null}
                {slotsState === "idle" ? (
                  <div className="slots">
                    Selecteaza data si serviciul pentru a vedea orele disponibile.
                  </div>
                ) : null}
                {slotsState === "loading" ? (
                  <div className="slots">Se incarca intervalele disponibile...</div>
                ) : null}
                {slotsState === "ready" ? (
                  slots.length ? (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {slots.map((slot) => {
                        const selected = slot.time === time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.taken}
                            onClick={() => setTime(slot.time)}
                            className={`btn ${
                              slot.taken
                                ? "btn-outline-secondary disabled"
                                : selected
                                  ? "btn-primary"
                                  : "btn-outline-secondary"
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="slots">Nu sunt intervale disponibile pentru ziua selectata.</div>
                  )
                ) : null}
              </div>

              {turnstileSiteKey ? (
                <div className="col-md-12 mt-3">
                  <div
                    className="cf-turnstile"
                    data-sitekey={turnstileSiteKey}
                    data-callback="onCameliaTurnstileSuccess"
                  />
                </div>
              ) : null}
            </div>

            <div className="btn_wrap pb-0 text-center mt-4 d-flex justify-content-center gap-3 flex-wrap">
              <button type="submit" className="btn btn-primary" disabled={submitState.type === "loading"}>
                <span className="btn_text" data-text="Programeaza">
                  {submitState.type === "loading" ? "Se salveaza..." : "Programeaza"}
                </span>
                <span className="btn_icon">
                  <i className="fa-solid fa-arrow-up-right" />
                </span>
              </button>

              <Link className="btn btn-outline-secondary" href="/preturi">
                <span className="btn_text" data-text="Vezi preturile">
                  Vezi preturile
                </span>
                <span className="btn_icon">
                  <i className="fa-solid fa-arrow-up-right" />
                </span>
              </Link>
            </div>
          </div>
        </form>

      </div>
    );
  }

  if (editorial) {
    return (
      <div className="space-y-6">
        {turnstileSiteKey ? (
          <Script
            nonce={nonce ?? undefined}
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
        ) : null}

        <AppointmentBookingEditorial
          availableServices={availableServices}
          bookingMode={bookingMode}
          name={name}
          email={email}
          phone={phone}
          service={service}
          date={date}
          time={time}
          firstVisit={firstVisit}
          userEmail={userEmail}
          submitState={submitState}
          slots={slots}
          slotsState={slotsState}
          turnstileSiteKey={turnstileSiteKey ?? undefined}
          onBookingModeChange={handleBookingModeChange}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onServiceChange={setService}
          onDateChange={setDate}
          onTimeChange={setTime}
          onFirstVisitChange={setFirstVisit}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {turnstileSiteKey ? (
        <Script
          nonce={nonce ?? undefined}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className={`flex flex-col gap-4 ${compact ? "" : "lg:flex-row lg:items-end lg:justify-between"}`}>
          <div className={compact ? "" : "max-w-2xl"}>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Programare online
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm text-slate-600">
            {userEmail ? (
              <p>
                Esti autentificat ca <span className="font-semibold text-slate-900">{userEmail}</span>.{" "}
                <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/cont/profil">
                  Actualizeaza profilul
                </Link>
              </p>
            ) : (
              <p>
                Poti rezerva ca turist sau iti poti{" "}
                <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/cont/inregistrare">
                  crea un cont
                </Link>{" "}
                pentru a salva datele.
              </p>
            )}
          </div>
        </div>

        {submitState.message ? (
          <div
            className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
              submitState.type === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {submitState.message}
          </div>
        ) : null}

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="booking-name">
              Nume complet
            </label>
            <input
              id="booking-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="booking-email">
              Email
            </label>
            <input
              id="booking-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={Boolean(userEmail)}
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
                userEmail
                  ? "border-slate-200 bg-slate-50 text-slate-500"
                  : "border-slate-200 text-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              }`}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="booking-phone">
              Telefon
            </label>
            <input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="booking-service">
              Serviciu
            </label>
            <select
              id="booking-service"
              value={service}
              onChange={(event) => setService(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              required
            >
              {availableServices.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title} - {item.priceLabel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="booking-date">
              Data
            </label>
            <input
              id="booking-date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              required
            />
          </div>

          <div className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Este prima vizita?
            </span>
            <div className="flex flex-wrap gap-3">
              {(["Da", "Nu"] as const).map((option) => (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    firstVisit === option
                      ? "border-teal-600 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="first-visit"
                    value={option}
                    checked={firstVisit === option}
                    onChange={() => setFirstVisit(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Ore disponibile</span>
              {slotsState === "loading" ? (
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                  Se incarca
                </span>
              ) : null}
            </div>

            {slotsState === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Nu am putut incarca intervalele disponibile pentru aceasta zi.
              </div>
            ) : null}

            {slotsState === "idle" ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Alege data si serviciul pentru a vedea intervalele disponibile.
              </div>
            ) : null}

            {slotsState === "ready" ? (
              slots.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {slots.map((slot) => {
                    const selected = slot.time === time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.taken}
                        onClick={() => setTime(slot.time)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          slot.taken
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through"
                            : selected
                              ? "border-teal-600 bg-teal-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Nu sunt intervale disponibile pentru ziua selectata.
                </div>
              )
            ) : null}
          </div>

          {turnstileSiteKey ? (
            <div className="md:col-span-2">
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onCameliaTurnstileSuccess"
              />
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitState.type === "loading"}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState.type === "loading" ? "Se salveaza..." : "Confirma programarea"}
            </button>
            <Link
              href="/preturi"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Vezi toate serviciile
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
