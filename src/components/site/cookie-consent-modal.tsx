"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import styles from "./cookie-consent-modal.module.css";

const COOKIE_CONSENT_STORAGE_KEY = "camelia_cookie_consent";
const COOKIE_CONSENT_COOKIE_NAME = "camelia_cookie_consent";
const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const SETTINGS_MORPH_DURATION_MS = 340;

type CookieConsentChoice = {
  analytics: boolean;
  marketing: boolean;
  necessary: true;
  savedAt: string;
  version: 1;
};

type CookieConsentPreference = Omit<
  CookieConsentChoice,
  "savedAt" | "version"
>;

const consentStoreListeners = new Set<() => void>();

function CookieIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.cookieIcon}
      fill="none"
      viewBox="0 0 64 64"
    >
      <path
        d="M52.4 34.7c-3.6.3-6.8-2.2-7.4-5.8-4.2.5-7.8-2.7-7.8-6.9 0-1.6.5-3.1 1.4-4.3A7.6 7.6 0 0 1 31.3 8C18.6 8.4 8.4 18.9 8.4 31.7 8.4 44.8 19.1 55.6 32.3 55.6c10.2 0 19-6.4 22.4-15.5.7-1.9-.3-3.8-2.3-5.4Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M52.4 34.7c-3.6.3-6.8-2.2-7.4-5.8-4.2.5-7.8-2.7-7.8-6.9 0-1.6.5-3.1 1.4-4.3A7.6 7.6 0 0 1 31.3 8C18.6 8.4 8.4 18.9 8.4 31.7 8.4 44.8 19.1 55.6 32.3 55.6c10.2 0 19-6.4 22.4-15.5.7-1.9-.3-3.8-2.3-5.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M24 24.5h.1M19.5 38.5h.1M35.6 42.2h.1M30.5 32.1h.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
}

function getStoredConsentSnapshot() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookieConsent = getCookieValue(COOKIE_CONSENT_COOKIE_NAME);

  if (cookieConsent) {
    return cookieConsent;
  }

  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseConsentSnapshot(snapshot: string) {
  if (!snapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(snapshot)) as Partial<CookieConsentChoice>;

    if (
      parsed.version === 1 &&
      parsed.necessary === true &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean" &&
      typeof parsed.savedAt === "string"
    ) {
      return parsed as CookieConsentChoice;
    }
  } catch {
    return null;
  }

  return null;
}

function emitConsentStoreChange() {
  for (const listener of consentStoreListeners) {
    listener();
  }
}

function subscribeToConsentStore(listener: () => void) {
  consentStoreListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    consentStoreListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerConsentSnapshot() {
  return "";
}

function persistConsent(choice: CookieConsentPreference) {
  const consent = {
    ...choice,
    savedAt: new Date().toISOString(),
    version: 1,
  } satisfies CookieConsentChoice;
  const encodedConsent = encodeURIComponent(JSON.stringify(consent));
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodedConsent}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureFlag}`;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // The cookie is the source of truth; localStorage is only a convenience mirror.
  }

  emitConsentStoreChange();
}

function isCmsPreviewRequest() {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("cms_preview") === "1" && Boolean(searchParams.get("previewed_page"));
}

function subscribeToCmsPreviewStore() {
  return () => {};
}

function getCmsPreviewSnapshot() {
  return isCmsPreviewRequest() ? "1" : "0";
}

function getServerCmsPreviewSnapshot() {
  return "0";
}

export function CookieConsentModal() {
  const suppressForCmsPreview =
    useSyncExternalStore(
      subscribeToCmsPreviewStore,
      getCmsPreviewSnapshot,
      getServerCmsPreviewSnapshot,
    ) === "1";
  const consentSnapshot = useSyncExternalStore(
    subscribeToConsentStore,
    getStoredConsentSnapshot,
    getServerConsentSnapshot,
  );
  const storedConsent = parseConsentSnapshot(consentSnapshot);
  const hasStoredConsent = Boolean(storedConsent);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClosingSettings, setIsClosingSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const settingsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = !suppressForCmsPreview && (forcedOpen || !hasStoredConsent);
  const showFloatingButton = !suppressForCmsPreview && hasStoredConsent && !visible;
  const settingsLayoutActive = showSettings || isClosingSettings;
  const settingsExpanded = showSettings && !isClosingSettings;
  const modalClassName = [
    styles.modal,
    settingsLayoutActive ? styles.modalAdvanced : "",
    settingsExpanded ? styles.modalExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");
  const settingsPanelClassName = [
    styles.settingsPanel,
    isClosingSettings ? styles.settingsPanelClosing : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    document.documentElement.classList.toggle("cookie-consent-open", visible);

    return () => {
      document.documentElement.classList.remove("cookie-consent-open");
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      if (settingsCloseTimerRef.current) {
        clearTimeout(settingsCloseTimerRef.current);
      }
    };
  }, []);

  function clearSettingsCloseTimer() {
    if (settingsCloseTimerRef.current) {
      clearTimeout(settingsCloseTimerRef.current);
      settingsCloseTimerRef.current = null;
    }
  }

  function openAdvancedSettings() {
    clearSettingsCloseTimer();
    setIsClosingSettings(false);
    setShowSettings(true);
  }

  function closeAdvancedSettings() {
    clearSettingsCloseTimer();
    setIsClosingSettings(true);

    settingsCloseTimerRef.current = setTimeout(() => {
      setShowSettings(false);
      setIsClosingSettings(false);
      settingsCloseTimerRef.current = null;
    }, SETTINGS_MORPH_DURATION_MS);
  }

  function toggleAdvancedSettings() {
    if (isClosingSettings) {
      openAdvancedSettings();
      return;
    }

    if (showSettings) {
      closeAdvancedSettings();
      return;
    }

    openAdvancedSettings();
  }

  function saveConsent(choice: CookieConsentPreference) {
    clearSettingsCloseTimer();
    persistConsent(choice);
    setAnalyticsEnabled(choice.analytics);
    setMarketingEnabled(choice.marketing);
    setForcedOpen(false);
    setShowSettings(false);
    setIsClosingSettings(false);
  }

  function acceptAll() {
    saveConsent({
      analytics: true,
      marketing: true,
      necessary: true,
    });
  }

  function rejectOptional() {
    saveConsent({
      analytics: false,
      marketing: false,
      necessary: true,
    });
  }

  function savePreferences() {
    saveConsent({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      necessary: true,
    });
  }

  function openPreferences() {
    const currentConsent =
      parseConsentSnapshot(getStoredConsentSnapshot()) ?? storedConsent;

    setAnalyticsEnabled(currentConsent?.analytics ?? false);
    setMarketingEnabled(currentConsent?.marketing ?? false);
    openAdvancedSettings();
    setForcedOpen(true);
  }

  function closeModal() {
    if (hasStoredConsent) {
      clearSettingsCloseTimer();
      setForcedOpen(false);
      setShowSettings(false);
      setIsClosingSettings(false);
      return;
    }

    rejectOptional();
  }

  return (
    <>
      {showFloatingButton ? (
        <button
          aria-label="Deschide setarile cookies"
          className={styles.floatingButton}
          onClick={openPreferences}
          type="button"
        >
          <CookieIcon />
        </button>
      ) : null}

      {visible ? (
        <>
          <div className={`${styles.blob} ${styles.blobSecondary}`} />
          <div className={`${styles.blob} ${styles.blobPrimary}`} />
          <div className={styles.root} role="presentation">
            <section
              aria-describedby="cookie-consent-description"
              aria-labelledby="cookie-consent-title"
              aria-modal="true"
              className={modalClassName}
              role="dialog"
            >
              <div className={styles.sidebar}>
                <CookieIcon />
              </div>

              <div className={styles.content}>
                <div className={styles.contentColumns}>
                  <div className={styles.primaryPanel}>
                    <div className={styles.header}>
                      <h2 className={styles.title} id="cookie-consent-title">
                        Setari Cookies
                      </h2>
                      <button
                        aria-label="Inchide setarile cookies"
                        className={styles.closeButton}
                        onClick={closeModal}
                        type="button"
                      >
                        <CloseIcon />
                      </button>
                    </div>

                    <p className={styles.copy} id="cookie-consent-description">
                      Folosim cookie-uri pentru a va asigura cea mai buna experienta pe site-ul
                      nostru, pentru a analiza traficul si pentru a personaliza continutul. Puteti
                      accepta toate cookie-urile, refuza cookie-urile optionale sau ajusta preferintele.
                    </p>

                    <div className={styles.actions}>
                      <button
                        className={`${styles.button} ${styles.primaryButton}`}
                        onClick={acceptAll}
                        type="button"
                      >
                        Accepta Tot
                      </button>

                      <div className={styles.secondaryActions}>
                        <button
                          className={`${styles.button} ${styles.secondaryButton}`}
                          onClick={rejectOptional}
                          type="button"
                        >
                          Refuza
                        </button>
                        <button
                          aria-expanded={settingsExpanded}
                          className={`${styles.button} ${styles.tertiaryButton}`}
                          onClick={toggleAdvancedSettings}
                          type="button"
                        >
                          {settingsExpanded ? "Ascunde Setarile" : "Setari Avansate"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.policy}>
                      <a className={styles.policyLink} href="/termeni">
                        Politica de Confidentialitate
                      </a>
                    </div>
                  </div>

                  {settingsLayoutActive ? (
                    <aside className={settingsPanelClassName}>
                      <div className={styles.preference}>
                        <div>
                          <p className={styles.preferenceTitle}>Necesare</p>
                          <p className={styles.preferenceCopy}>
                            Esentiale pentru functionarea site-ului si nu pot fi dezactivate.
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input checked disabled type="checkbox" />
                          <span className={styles.switchTrack} />
                          <span className={styles.switchThumb} />
                        </label>
                      </div>

                      <div className={styles.preference}>
                        <div>
                          <p className={styles.preferenceTitle}>Analiza</p>
                          <p className={styles.preferenceCopy}>
                            Ne ajuta sa intelegem cum este folosit site-ul.
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            checked={analyticsEnabled}
                            onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                            type="checkbox"
                          />
                          <span className={styles.switchTrack} />
                          <span className={styles.switchThumb} />
                        </label>
                      </div>

                      <div className={styles.preference}>
                        <div>
                          <p className={styles.preferenceTitle}>Personalizare</p>
                          <p className={styles.preferenceCopy}>
                            Permite continut si mesaje adaptate preferintelor.
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            checked={marketingEnabled}
                            onChange={(event) => setMarketingEnabled(event.target.checked)}
                            type="checkbox"
                          />
                          <span className={styles.switchTrack} />
                          <span className={styles.switchThumb} />
                        </label>
                      </div>

                      <button
                        className={`${styles.button} ${styles.primaryButton}`}
                        onClick={savePreferences}
                        type="button"
                      >
                        Salveaza Preferintele
                      </button>
                    </aside>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
