"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "./public-account-menu.module.css";

type PublicAccountMenuProps = {
  variant?: "desktop" | "mobile";
};

type SessionUserPreview = {
  avatarUrl?: string | null;
  displayName: string;
  email?: string | null;
};

function getDisplayName(user: SessionUserPreview | null) {
  if (!user) {
    return "Cont";
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  return "Cont";
}

function getInitials(label: string) {
  const tokens = label
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "C";
}

function getAvatarUrl(user: SessionUserPreview | null) {
  return typeof user?.avatarUrl === "string" && user.avatarUrl.trim() ? user.avatarUrl : null;
}

export function PublicAccountMenu({
  variant = "desktop",
}: PublicAccountMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<SessionUserPreview | null>(null);
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    void fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as {
          ok?: boolean;
          user?: SessionUserPreview | null;
        };

        return payload.ok ? payload.user ?? null : null;
      })
      .then((sessionUser) => {
        if (active) {
          setUser(sessionUser);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (variant !== "desktop" || !open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, variant]);

  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/signout", {
        credentials: "same-origin",
        method: "POST",
      });
    } finally {
      setIsSigningOut(false);
    }

    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (variant === "mobile") {
    if (!user) {
      return (
        <Link className={styles.mobileLoginButton} href="/cont/autentificare?redirectTo=/cont/dashboard">
          Autentificare
        </Link>
      );
    }

    return (
      <div className={styles.mobileAccountBlock}>
        <Link className={styles.mobileAccountButton} href="/cont/dashboard">
          <span className={styles.avatarShell}>
            {avatarUrl ? (
              <img
                alt={displayName}
                className={styles.avatarImage}
                height={36}
                src={avatarUrl}
                width={36}
              />
            ) : (
              <span className={styles.avatarFallback}>{getInitials(displayName)}</span>
            )}
          </span>
          <span>Panou pacient</span>
        </Link>
        <button
          className={styles.mobileLogoutButton}
          disabled={isSigningOut}
          type="button"
          onClick={() => void handleSignOut()}
        >
          {isSigningOut ? "Se deconecteaza..." : "Deconectare"}
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <Link className={styles.loginButton} href="/cont/autentificare?redirectTo=/cont/dashboard">
        Autentificare
      </Link>
    );
  }

  return (
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={styles.accountButton}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatarShell}>
          {avatarUrl ? (
            <img
              alt={displayName}
              className={styles.avatarImage}
              height={36}
              src={avatarUrl}
              width={36}
            />
          ) : (
            <span className={styles.avatarFallback}>{getInitials(displayName)}</span>
          )}
        </span>
        <span className={styles.accountLabel}>Cont</span>
      </button>

      <div className={`${styles.accountDropdown}${open ? ` ${styles.accountDropdownOpen}` : ""}`}>
        <div className={styles.accountMeta}>
          <p className={styles.accountName}>{displayName}</p>
          {user.email ? <p className={styles.accountEmail}>{user.email}</p> : null}
        </div>
        <Link className={styles.dropdownAction} href="/cont/dashboard" onClick={() => setOpen(false)}>
          Panou pacient
        </Link>
        <button
          className={styles.dropdownLogout}
          disabled={isSigningOut}
          type="button"
          onClick={() => void handleSignOut()}
        >
          {isSigningOut ? "Se deconecteaza..." : "Deconectare"}
        </button>
      </div>
    </div>
  );
}
