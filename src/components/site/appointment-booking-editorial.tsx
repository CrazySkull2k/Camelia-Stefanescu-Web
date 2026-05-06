import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./appointment-booking-editorial.module.css";

type BookableService = {
  title: string;
  slug: string;
  categoryKey: string;
  durationMinutes?: number;
  priceLabel: string;
  subtitle?: string;
  featureBullets?: string[];
  visible: boolean;
  bookable: boolean;
};

type SubmitState = {
  type: "idle" | "loading" | "error" | "success";
  message?: string;
};

type Slot = {
  time: string;
  taken: boolean;
};

type AppointmentBookingEditorialProps = {
  availableServices: BookableService[];
  bookingMode: "guest" | "account";
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  firstVisit: "Da" | "Nu";
  userEmail?: string | null;
  submitState: SubmitState;
  slots: Slot[];
  slotsState: "idle" | "loading" | "ready" | "error";
  turnstileSiteKey?: string;
  onBookingModeChange: (value: "guest" | "account") => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onFirstVisitChange: (value: "Da" | "Nu") => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

type BookingCategoryOption = {
  key: string;
  label: string;
  description: string;
};

type CalendarDay = {
  value: string;
  dayOfMonth: number;
  currentMonth: boolean;
  disabled: boolean;
};

const categoryCopy: Record<string, Omit<BookingCategoryOption, "key">> = {
  "diagnoza-celulara": {
    label: "Diagnoza Celulara",
    description: "Mapare bio-rezonanta pentru functiile celulare si metabolice.",
  },
  nutritie: {
    label: "Nutritie",
    description: "Programe nutritionale ghidate pentru echilibru hormonal si metabolic.",
  },
  "terapie-shockwave": {
    label: "Terapie Shockwave",
    description: "Protocol non-invaziv pentru recuperare, stimulare si confort local.",
  },
};

const weekdayLabels = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];

function getCategoryOptions(services: BookableService[]): BookingCategoryOption[] {
  const seen = new Set<string>();

  return services.flatMap((service) => {
    if (seen.has(service.categoryKey)) {
      return [];
    }

    seen.add(service.categoryKey);
    const copy = categoryCopy[service.categoryKey];

    return [
      {
        key: service.categoryKey,
        label: copy?.label ?? service.categoryKey,
        description:
          copy?.description ?? "Alege consultatia potrivita pentru obiectivul tau.",
      },
    ];
  });
}

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(visibleMonth: Date, today: Date): CalendarDay[] {
  const firstDayOfMonth = startOfMonth(visibleMonth);
  const offset = (firstDayOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDayOfMonth);
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstVisibleDay);
    current.setDate(firstVisibleDay.getDate() + index);
    const normalized = new Date(current.getFullYear(), current.getMonth(), current.getDate());

    return {
      value: toDateValue(normalized),
      dayOfMonth: normalized.getDate(),
      currentMonth: isSameMonth(normalized, visibleMonth),
      disabled: normalized < today,
    };
  });
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getSlotPeriod(time: string) {
  const hour = Number.parseInt(time.split(":")[0] ?? "0", 10);

  if (hour < 12) {
    return "Dimineata";
  }

  if (hour < 17) {
    return "Pranz";
  }

  return "Seara";
}

function CategoryIcon({ categoryKey }: { categoryKey: string }) {
  if (categoryKey === "terapie-shockwave") {
    return (
      <svg aria-hidden="true" className={styles.categoryIcon} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12C6.5 12 6.5 6 10 6C13.5 6 13.5 18 17 18C20.5 18 20.5 12 21 12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (categoryKey === "nutritie") {
    return (
      <svg aria-hidden="true" className={styles.categoryIcon} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 20C16.4183 20 20 15.9706 20 11C20 6.02944 16.4183 3 12 3C7.58172 3 4 6.02944 4 11C4 15.9706 7.58172 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M12 20C12 15 14.5 11 18.5 8.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={styles.categoryIcon} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M18 16L18.8 18.2L21 19L18.8 19.8L18 22L17.2 19.8L15 19L17.2 18.2L18 16Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className={styles.buttonArrow} viewBox="0 0 16 16" fill="none">
      <path
        d="M4 12L12 4M12 4H5.75M12 4V10.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path
        d="M9.75 3.5L5.25 8L9.75 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path
        d="M6.25 3.5L10.75 8L6.25 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className={styles.visitIcon} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L13.6 8.4L19 10L13.6 11.6L12 17L10.4 11.6L5 10L10.4 8.4L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10" fill="none">
      <path
        d="M2.25 6.2L4.7 8.65L9.75 3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function AppointmentBookingEditorial({
  availableServices,
  bookingMode,
  name,
  email,
  phone,
  service,
  date,
  time,
  firstVisit,
  userEmail,
  submitState,
  slots,
  slotsState,
  turnstileSiteKey,
  onBookingModeChange,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onServiceChange,
  onDateChange,
  onTimeChange,
  onFirstVisitChange,
  onSubmit,
}: AppointmentBookingEditorialProps) {
  const categories = useMemo(
    () => getCategoryOptions(availableServices),
    [availableServices],
  );
  const today = useMemo(() => getTodayDate(), []);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parseDateValue(date) ?? today),
  );

  const selectedService =
    availableServices.find((item) => item.slug === service) ?? availableServices[0] ?? null;
  const selectedCategoryKey =
    selectedService?.categoryKey ?? categories[0]?.key ?? "";
  const servicesInCategory = availableServices.filter(
    (item) => item.categoryKey === selectedCategoryKey,
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, today),
    [visibleMonth, today],
  );
  const canMovePrev = visibleMonth > startOfMonth(today);
  const calendarPanelRef = useRef<HTMLDivElement | null>(null);
  const [timePanelHeight, setTimePanelHeight] = useState<number | null>(null);
  const bookingEditorialInstanceId = useId().replace(/:/g, "");

  useEffect(() => {
    const panel = calendarPanelRef.current;

    if (!panel || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      setTimePanelHeight(panel.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(panel);

    return () => {
      observer.disconnect();
    };
  }, []);

  const timePanelRule = useMemo(() => {
    if (!timePanelHeight) {
      return "";
    }

    return `[data-booking-editorial="${bookingEditorialInstanceId}"] .${styles.timePanel}{--time-panel-height:${timePanelHeight}px;}`;
  }, [bookingEditorialInstanceId, timePanelHeight]);

  if (!availableServices.length) {
    return (
      <div className={styles.root} data-booking-editorial={bookingEditorialInstanceId}>
        {timePanelRule ? <style jsx global>{timePanelRule}</style> : null}
        <div className={`${styles.alert} ${styles.alertError}`}>
          Nu exista servicii disponibile momentan pentru programare.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} data-booking-editorial={bookingEditorialInstanceId}>
      {timePanelRule ? <style jsx global>{timePanelRule}</style> : null}
      <div className={styles.infoBar}>
        <p className={styles.infoText}>
          {userEmail ? (
            <>
              Esti autentificat ca <strong>{userEmail}</strong>.{" "}
              <Link className={styles.infoLink} href="/cont/profil">
                Actualizeaza profilul pacientului
              </Link>
              .
            </>
          ) : (
            <>
              Alege daca vrei sa continui fara cont sau sa iti folosesti un cont pacient pentru
              a-ti regasi mai usor programarile si datele personale.
            </>
          )}
        </p>
      </div>

      {!userEmail ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>0. Cum vrei sa continui?</h2>
            <span className={styles.sectionMeta}>Preferinta memorata</span>
          </div>

          <div className={styles.modeGrid}>
            {([
              {
                key: "guest" as const,
                title: "Fara cont",
                text: "Rezervi rapid, iar apoi poti verifica programarea cu codul primit pe email.",
              },
              {
                key: "account" as const,
                title: "Cu cont pacient",
                text: "Iti pastrezi istoricul programarilor si precompletarea datelor personale.",
              },
            ]).map((option) => {
              const active = bookingMode === option.key;

              return (
                <button
                  key={option.key}
                  className={`${styles.modeCard}${active ? ` ${styles.modeCardActive}` : ""}`}
                  onClick={() => onBookingModeChange(option.key)}
                  type="button"
                >
                  <div>
                    <p className={styles.modeTitle}>{option.title}</p>
                    <p className={styles.modeText}>{option.text}</p>
                  </div>
                  <span aria-hidden="true" className={styles.categoryCheck}>
                    {active ? <CheckIcon /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          {bookingMode === "account" ? (
            <div className={styles.accountPrompt}>
              <p className={styles.infoText}>
                Autentifica-te sau creeaza-ti contul, iar daca vrei sa ramai guest poti reveni
                oricand la optiunea fara cont.
              </p>
              <div className={styles.footerActions}>
                <Link
                  className={styles.primaryButton}
                  href={`/cont/autentificare?redirectTo=/programare${
                    email ? `&email=${encodeURIComponent(email)}` : ""
                  }`}
                >
                  Intra in cont
                </Link>
                <Link
                  className={styles.secondaryButton}
                  href={`/cont/inregistrare?redirectTo=/programare${
                    email ? `&email=${encodeURIComponent(email)}` : ""
                  }`}
                >
                  Creeaza cont
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {submitState.message ? (
        <div
          className={`${styles.alert} ${
            submitState.type === "error" ? styles.alertError : styles.alertSuccess
          }`}
        >
          {submitState.message}
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Alege categoria</h2>
            <span className={styles.sectionMeta}>Curated pentru nevoia ta</span>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => {
              const active = category.key === selectedCategoryKey;

              return (
                <button
                  key={category.key}
                  type="button"
                  className={`${styles.categoryCard}${active ? ` ${styles.categoryCardActive}` : ""}`}
                  onClick={() => {
                    const nextService = availableServices.find(
                      (item) => item.categoryKey === category.key,
                    );

                    if (nextService) {
                      onServiceChange(nextService.slug);
                    }
                  }}
                >
                  <div>
                    <CategoryIcon categoryKey={category.key} />
                    <h3 className={styles.categoryName}>{category.label}</h3>
                    <p className={styles.categoryDescription}>{category.description}</p>
                  </div>

                  <span aria-hidden="true" className={styles.categoryCheck}>
                    ✓
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`${styles.sectionHeader} mt-5`}>
            <h2 className={styles.sectionTitle}>2. Alege serviciul</h2>
            <span className={styles.sectionMeta}>
              {servicesInCategory.length} optiuni disponibile
            </span>
          </div>

          <div className={styles.serviceList}>
            {servicesInCategory.map((item) => {
              const active = item.slug === service;
              const bullets = (item.featureBullets ?? []).slice(0, 2);

              return (
                <button
                  key={item.slug}
                  type="button"
                  className={`${styles.serviceOption}${active ? ` ${styles.serviceOptionActive}` : ""}`}
                  onClick={() => onServiceChange(item.slug)}
                >
                  <div className={styles.serviceTop}>
                    <div>
                      <p className={styles.serviceTitle}>{item.title}</p>
                      {item.subtitle ? (
                        <div className={styles.serviceMeta}>{item.subtitle}</div>
                      ) : null}
                    </div>
                    <span className={styles.servicePrice}>{item.priceLabel}</span>
                  </div>

                  {bullets.length ? (
                    <ul className={styles.serviceBullets}>
                      {bullets.map((bullet) => (
                        <li className={styles.serviceBullet} key={bullet}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.dateTimeGrid}>
            <div className={styles.dateTimeColumn}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>3. Selecteaza data</h2>
                <span className={styles.sectionMeta}>Zile disponibile</span>
              </div>

              <div
                ref={calendarPanelRef}
                className={`${styles.panel} ${styles.calendarPanel}`}
              >
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>{getMonthLabel(visibleMonth)}</span>
                  <div className={styles.calendarControls}>
                    <button
                      type="button"
                      className={styles.calendarControl}
                      disabled={!canMovePrev}
                      onClick={() =>
                        setVisibleMonth((current) => addMonths(current, -1))
                      }
                    >
                      <ChevronLeftIcon />
                    </button>
                    <button
                      type="button"
                      className={styles.calendarControl}
                      onClick={() =>
                        setVisibleMonth((current) => addMonths(current, 1))
                      }
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>

                <div className={styles.weekdays}>
                  {weekdayLabels.map((label) => (
                    <span className={styles.weekday} key={label}>
                      {label}
                    </span>
                  ))}
                </div>

                <div className={styles.calendarGrid}>
                  {calendarDays.map((day) => {
                    const active = day.value === date;

                    return (
                      <button
                        key={day.value}
                        type="button"
                        disabled={day.disabled}
                        className={[
                          styles.dayButton,
                          !day.currentMonth ? styles.dayButtonMuted : "",
                          day.disabled ? styles.dayButtonDisabled : "",
                          active ? styles.dayButtonSelected : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => {
                          onDateChange(day.value);
                          if (!day.currentMonth) {
                            setVisibleMonth(
                              startOfMonth(parseDateValue(day.value) ?? visibleMonth),
                            );
                          }
                        }}
                      >
                        {day.dayOfMonth}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.timeColumn}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>4. Alege ora</h2>
                <span className={styles.sectionMeta}>Ora Romaniei</span>
              </div>

              <div
                className={`${styles.panel} ${styles.timePanel}`}
              >
                <div className={styles.slotList}>
                  {slotsState === "error" ? (
                    <div className={`${styles.slotState} ${styles.slotStateError}`}>
                      Nu am putut incarca intervalele disponibile pentru aceasta zi.
                    </div>
                  ) : null}

                  {slotsState === "idle" ? (
                    <div className={styles.slotState}>
                      Alege intai serviciul si data pentru a vedea intervalele disponibile.
                    </div>
                  ) : null}

                  {slotsState === "loading" ? (
                    <div className={styles.slotState}>
                      Se incarca intervalele disponibile...
                    </div>
                  ) : null}

                  {slotsState === "ready" ? (
                    slots.length ? (
                      slots.map((slot) => {
                        const selected = slot.time === time;
                        const period = getSlotPeriod(slot.time);

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.taken}
                            onClick={() => onTimeChange(slot.time)}
                            className={[
                              styles.slotButton,
                              selected ? styles.slotButtonSelected : "",
                              slot.taken ? styles.slotButtonTaken : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <span className={styles.slotTime}>{slot.time}</span>
                            <span className={styles.slotBadge}>
                              {slot.taken ? "Rezervat" : period}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className={styles.slotState}>
                        Nu sunt intervale disponibile pentru ziua selectata.
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Detalii personale</h2>
            <span className={styles.sectionMeta}>Date securizate</span>
          </div>

          <div className={styles.personalGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="booking-editorial-name">
                Nume complet
              </label>
              <input
                id="booking-editorial-name"
                type="text"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                className={styles.input}
                placeholder="Numele tau complet"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="booking-editorial-email">
                Email
              </label>
              <input
                id="booking-editorial-email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                className={`${styles.input}${userEmail ? ` ${styles.inputDisabled}` : ""}`}
                disabled={Boolean(userEmail)}
                placeholder="email@exemplu.ro"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="booking-editorial-phone">
                Telefon
              </label>
              <input
                id="booking-editorial-phone"
                type="tel"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                className={styles.input}
                placeholder="07xx xxx xxx"
                required
              />
            </div>
          </div>

          <div className={styles.visitToggle}>
            <div className={styles.visitCopy}>
              <SparkIcon />
              <div>
                <p className={styles.visitTitle}>Este prima vizita?</p>
                <p className={styles.visitText}>
                  Daca raspunsul este da, dupa confirmare se deschide chestionarul de evaluare.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-pressed={firstVisit === "Da"}
              className={`${styles.switch}${firstVisit === "Da" ? ` ${styles.switchActive}` : ""}`}
              onClick={() => onFirstVisitChange(firstVisit === "Da" ? "Nu" : "Da")}
            />
          </div>

          {turnstileSiteKey ? (
            <div className={styles.turnstile}>
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onCameliaTurnstileSuccess"
              />
            </div>
          ) : null}
        </section>

        <footer className={styles.footer}>
          <p className={styles.footerNote}>
            Confirmarea programarii implica acceptarea politicii de anulare cu minimum 24 de ore inainte.
          </p>

          <div className={styles.footerActions}>
            <button
              type="submit"
              disabled={submitState.type === "loading"}
              className={styles.primaryButton}
            >
              {submitState.type === "loading" ? "Se salveaza..." : "Confirma programarea"}
              <ArrowIcon />
            </button>
            <Link className={styles.secondaryButton} href="/preturi">
              Vezi toate serviciile
            </Link>
          </div>
        </footer>
      </form>
    </div>
  );
}
