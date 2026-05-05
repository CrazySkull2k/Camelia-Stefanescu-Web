"use client";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CircleHelp,
  FileHeart,
  Home,
  LogOut,
  LayoutGrid,
  Search,
  UserRound,
} from "lucide-react";
import clsx from "clsx";

type PatientAccountShellProps = {
  avatarUrl?: string | null;
  displayName: string;
  email?: string | null;
  children: React.ReactNode;
};

type DesktopNavItem = {
  href: string;
  label: string;
  matchPrefix?: boolean;
};

type MobileNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const desktopNavigation: DesktopNavItem[] = [
  { href: "/cont/programari", label: "Programari", matchPrefix: true },
  { href: "/cont/chestionar", label: "Evaluare", matchPrefix: true },
  { href: "/cont/analize", label: "Analize", matchPrefix: true },
  { href: "/cont/support", label: "Support", matchPrefix: true },
];

const mobileNavigation: MobileNavItem[] = [
  { href: "/cont/dashboard", label: "Acasa", icon: Home, exact: true },
  { href: "/cont/programari", label: "Programari", icon: CalendarDays },
  { href: "/cont/analize", label: "Analize", icon: FileHeart },
  { href: "/cont/support", label: "Support", icon: CircleHelp },
  { href: "/cont/profil", label: "Profil", icon: UserRound },
];

function isActivePath(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(displayName: string) {
  const tokens = displayName
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "P";
}

export function PatientAccountShell({
  avatarUrl,
  displayName,
  email,
  children,
}: PatientAccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", {
      credentials: "same-origin",
      method: "POST",
    });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#31332c]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#b1b3a9]/15 bg-[#fbf9f4]/80 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-[86rem] items-center justify-between gap-6 pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8">
          <div className="-ml-12 flex min-w-0 items-center gap-4 lg:-ml-24 lg:gap-6 xl:-ml-36 xl:gap-8 2xl:-ml-44">
            <Link
              className="hidden shrink-0 items-center gap-2 rounded-full border border-[#b1b3a9]/16 bg-white px-3.5 py-2 text-sm font-semibold text-[#5f5e5e] transition hover:bg-[#fff7f3] xl:inline-flex"
              href="/"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Inapoi la website</span>
            </Link>
            <Link
              aria-label="Dr. Camelia Stefanescu"
              className="shrink-0 transition hover:opacity-80"
              href="/cont/dashboard"
            >
              <Image
                alt="Dr. Camelia Stefanescu"
                className="h-auto w-[12.75rem]"
                height={54}
                priority
                src="/site/brand/logo.png"
                width={248}
              />
            </Link>
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-[#b1b3a9]/12 bg-white/60 p-1.5 shadow-[0px_10px_24px_rgba(49,51,44,0.04)] lg:flex">
              {desktopNavigation.map((item) => {
                const active = isActivePath(
                  pathname,
                  item.href,
                  item.matchPrefix ? false : true,
                );

                return (
                  <Link
                    key={item.href}
                    className={clsx(
                      "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold tracking-tight transition-all",
                      active
                        ? "border-[#f0cfb0] bg-[#ffdcbd] text-[#654d35] shadow-[0px_8px_18px_rgba(101,77,53,0.12)]"
                        : "border-transparent text-[#31332c]/68 hover:border-[#f0cfb0]/70 hover:bg-[#fff7f3] hover:text-[#654d35]",
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="-mr-14 flex shrink-0 items-center gap-2.5 lg:-mr-28 lg:gap-3 xl:-mr-40 2xl:-mr-52">
            <div className="hidden h-12 items-center rounded-full border border-[#b1b3a9]/12 bg-[#efeee6] pl-4 pr-5 lg:flex">
              <Search className="h-4 w-4 text-[#797c73]" />
              <input
                className="w-44 border-none bg-transparent px-3 text-sm text-[#31332c] outline-none placeholder:text-[#797c73] xl:w-52"
                placeholder="Cauta in cont..."
                type="text"
              />
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f5e5e] transition hover:bg-white/70"
              type="button"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5f5e5e] transition hover:bg-white/70"
              href="/cont/support"
            >
              <CircleHelp className="h-5 w-5" />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#ffdcbd] bg-white text-sm font-semibold text-[#654d35] transition hover:scale-[1.02] hover:shadow-[0px_8px_20px_rgba(49,51,44,0.08)]"
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
              >
                {avatarUrl ? (
                  <img
                    alt={displayName}
                    className="h-full w-full object-cover"
                    height={48}
                    src={avatarUrl}
                    width={48}
                  />
                ) : (
                  getInitials(displayName)
                )}
              </button>

              <div
                className={clsx(
                  "absolute right-0 top-[calc(100%+12px)] w-72 rounded-[1.5rem] border border-[#b1b3a9]/14 bg-white p-3 shadow-[0px_22px_44px_rgba(49,51,44,0.14)] transition-all",
                  menuOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0",
                )}
              >
                <div className="border-b border-[#b1b3a9]/12 px-3 pb-3 pt-2">
                  <p className="text-sm font-semibold text-[#31332c]">{displayName}</p>
                  {email ? (
                    <p className="mt-1 text-xs text-[#5e6058]">{email}</p>
                  ) : null}
                </div>

                <div className="mt-2 grid gap-1">
                  <Link
                    className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#f5f4ed]"
                    href="/cont/dashboard"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutGrid className="h-4 w-4 text-[#5f5e5e]" />
                    Panou pacient
                  </Link>
                  <Link
                    className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#f5f4ed]"
                    href="/cont/profil"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4 text-[#5f5e5e]" />
                    Profilul meu
                  </Link>
                  <button
                    className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#7a4d34] transition hover:bg-[#fff7f3]"
                    type="button"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Deconectare
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-28 pt-28 sm:px-6 lg:px-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around rounded-t-[2rem] border-t border-[#b1b3a9]/10 bg-[#ffffff]/92 px-3 pb-5 pt-3 shadow-[0px_-8px_24px_rgba(49,51,44,0.03)] backdrop-blur-xl md:hidden">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href, item.exact ?? false);

          return (
            <Link
              key={`${item.href}:${item.label}`}
              className={clsx(
                "flex min-w-[4.3rem] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-center transition-transform duration-200 active:scale-90",
                active
                  ? "bg-[#ffdcbd] text-[#654d35]"
                  : "text-[#31332c]/55",
              )}
              href={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
