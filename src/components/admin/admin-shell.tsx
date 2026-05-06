"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus2,
  CircleHelp,
  DollarSign,
  FilePenLine,
  FolderHeart,
  LayoutDashboard,
  LogOut,
  NotebookTabs,
  Search,
  Settings,
  ShieldCheck,
  SquarePen,
} from "lucide-react";
import clsx from "clsx";

type AdminShellProps = {
  adminUser?: {
    avatarUrl?: string | null;
    displayName: string;
    email?: string | null;
  } | null;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  matchPrefix?: boolean;
};

type QuickLink = {
  href: string;
  label: string;
};

type MobileNavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const primaryNavigation: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Panou" },
  {
    href: "/admin/appointments",
    icon: CalendarPlus2,
    label: "Programari",
    matchPrefix: true,
  },
  {
    href: "/admin/calendar",
    icon: CalendarDays,
    label: "Calendar",
    matchPrefix: true,
  },
  {
    href: "/admin/patients",
    icon: FolderHeart,
    label: "Pacienti",
    matchPrefix: true,
  },
  {
    href: "/admin/blog",
    icon: SquarePen,
    label: "Blog",
    matchPrefix: true,
  },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Setari",
    matchPrefix: true,
  },
];

const secondaryNavigation: NavItem[] = [
  {
    href: "/admin/content",
    icon: NotebookTabs,
    label: "Continut",
    matchPrefix: true,
  },
  {
    href: "/admin/pricing",
    icon: DollarSign,
    label: "Preturi",
    matchPrefix: true,
  },
  {
    href: "/admin/security",
    icon: ShieldCheck,
    label: "Security",
    matchPrefix: true,
  },
];

const quickLinks: QuickLink[] = [
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/appointments", label: "Consultatii" },
  { href: "/admin/patients", label: "Pacienti" },
  { href: "/admin/security", label: "Security" },
];

const mobileNavigation: MobileNavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Acasa" },
  { href: "/admin/appointments", icon: CalendarPlus2, label: "Programari" },
  { href: "/admin/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/admin/patients", icon: FolderHeart, label: "Pacienti" },
  { href: "/admin/blog", icon: FilePenLine, label: "Blog" },
];

function getInitials(displayName: string) {
  const tokens = displayName
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token.charAt(0).toUpperCase()).join("") || "DS";
}

function isActivePath(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageMeta(pathname: string) {
  if (pathname === "/admin") {
    return {
      description:
        "Your sanctuary for patient care is prepared. Today’s overview stays tied to the live data already in your dashboard.",
      eyebrow: "Administrare cabinet",
      heading: "Panou",
      showIntro: false,
    };
  }

  if (pathname === "/admin/appointments" || pathname.startsWith("/admin/appointments/")) {
    return {
      description: "",
      eyebrow: "",
      heading: "Programari",
      showIntro: false,
    };
  }

  if (pathname === "/admin/calendar" || pathname.startsWith("/admin/calendar/")) {
    return {
      description: "",
      eyebrow: "",
      heading: "Calendar",
      showIntro: false,
    };
  }

  if (pathname === "/admin/patients" || pathname.startsWith("/admin/patients/")) {
    return {
      description: "",
      eyebrow: "",
      heading: "Pacienti",
      showIntro: false,
    };
  }

  if (pathname === "/admin/blog" || pathname.startsWith("/admin/blog/")) {
    return {
      description: "",
      eyebrow: "",
      heading: "Blog",
      showIntro: false,
    };
  }

  const routeMeta = [
    {
      description: "Revizuieste programarile primite, statusurile, sincronizarea si modificarile de calendar.",
      heading: "Programari",
      href: "/admin/appointments",
    },
    {
      description: "Calendarul operational al cabinetului, cu programari si blockuri custom de disponibilitate.",
      heading: "Calendar",
      href: "/admin/calendar",
    },
    {
      description: "Profiluri de pacient, programari asociate, evaluari nutritionale si documente.",
      heading: "Pacienti",
      href: "/admin/patients",
    },
    {
      description: "Evaluari nutritionale trimise si documente generate.",
      heading: "Evaluari",
      href: "/admin/forms",
    },
    {
      description: "Ciorne, articole publicate si controale editoriale pentru site-ul public.",
      heading: "Blog",
      href: "/admin/blog",
    },
    {
      description: "Actualizeaza textele site-ului si sectiunile CMS structurate in siguranta.",
      heading: "Continut",
      href: "/admin/content",
    },
    {
      description: "Sectiuni de servicii, oferte vizibile si ordinea publica a preturilor.",
      heading: "Preturi",
      href: "/admin/pricing",
    },
    {
      description: "Reguli pentru confirmarea programarilor si setari operationale esentiale.",
      heading: "Setari",
      href: "/admin/settings",
    },
    {
      description: "Observability pentru auth, webhooks, rate limits si sincronizarea calendarului.",
      heading: "Security",
      href: "/admin/security",
    },
  ];

  const matched =
    routeMeta.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ??
    routeMeta[0];

  return {
    description: matched.description,
    eyebrow: "Administrare cabinet",
    heading: matched.heading,
    showIntro: true,
  };
}

export function AdminShell({ adminUser, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = adminUser?.displayName?.trim() || "Dr. Stefanescu";
  const email = adminUser?.email?.trim() || null;
  const avatarUrl = adminUser?.avatarUrl?.trim() || null;
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);

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
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell selection:bg-[#ffdcbd] selection:text-[#654d35]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#f5f4ed] py-8 lg:flex">
        <div className="px-8 pb-10">
          <h1 className="font-serif text-2xl italic text-[#31332c]">Dr. Stefanescu</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#5e6058]/70">
            Administrare cabinet
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href, item.href === "/admin");

            return (
              <Link
                key={item.href}
                className={clsx(
                  "group flex min-h-11 items-center gap-4 rounded-r-full py-3 transition-colors",
                  active
                    ? "border-l-4 border-[#5f5e5e] pl-4 font-bold text-[#5f5e5e]"
                    : "pl-5 text-[#31332c]/60 hover:bg-[#ebeae2]",
                )}
                href={item.href}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-lg leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6">
          <Link
            className="admin-cta-primary flex w-full items-center justify-center gap-2 rounded-full bg-[#31332c] px-6 py-4 text-sm font-semibold !text-[#fff7f3] shadow-[0px_12px_28px_rgba(49,51,44,0.16)] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3] focus-visible:!text-[#fff7f3]"
            href="/admin/appointments/new"
          >
            <PlusIcon />
            <span>Programare noua</span>
          </Link>

          <div className="mt-8 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#e2e3d9] text-sm font-semibold text-[#5f5e5e]">
              {avatarUrl ? (
                <img
                  alt={displayName}
                  className="h-full w-full object-cover"
                  height={40}
                  src={avatarUrl}
                  width={40}
                />
              ) : (
                getInitials(displayName)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#31332c]">{displayName}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#5e6058]/60">
                Medic coordonator
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-1 rounded-[1.5rem] bg-white/70 p-2">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-[#ebeae2] text-[#31332c]"
                      : "text-[#5e6058] hover:bg-[#ebeae2]",
                  )}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-[#b1b3a9]/15 bg-[#fbf9f4]/80 px-4 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] backdrop-blur-md sm:px-6 lg:left-64 lg:px-8">
        <div className="flex min-w-0 items-center gap-8 lg:gap-12">
          <Link
            className="hidden shrink-0 font-serif text-xl italic tracking-tight text-[#31332c] lg:block"
            href="/admin"
          >
            Panou cabinet
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold tracking-tight lg:flex">
            {quickLinks.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "transition-all",
                    active
                      ? "border-b-2 border-[#5f5e5e] pb-1 text-[#5f5e5e]"
                      : "text-[#31332c]/70 hover:text-[#5f5e5e]",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-6">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#797c73]" />
            <input
              className="w-56 rounded-full border-none bg-[#efeee6] py-2 pl-10 pr-4 text-sm text-[#31332c] outline-none ring-0 transition placeholder:text-[#797c73] focus:ring-1 focus:ring-[#5f5e5e]/30 lg:w-64"
              placeholder="Cauta pacienti..."
              type="text"
            />
          </div>

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5f5e5e] transition hover:bg-white/70"
            type="button"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5f5e5e] transition hover:bg-white/70"
            type="button"
          >
            <CircleHelp className="h-5 w-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#ffdcbd] bg-[#e2e3d9] text-sm font-semibold text-[#5f5e5e] transition hover:opacity-90"
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {avatarUrl ? (
                <img
                  alt={displayName}
                  className="h-full w-full object-cover"
                  height={40}
                  src={avatarUrl}
                  width={40}
                />
              ) : (
                getInitials(displayName)
              )}
            </button>

            <div
              className={clsx(
                "absolute right-0 top-[calc(100%+12px)] w-72 rounded-[1.5rem] border border-[#d8d5cc] bg-white p-3 shadow-[0px_22px_44px_rgba(49,51,44,0.14)] transition-all",
                menuOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1 opacity-0",
              )}
            >
              <div className="border-b border-[#d8d5cc] px-3 pb-3 pt-2">
                <p className="text-sm font-semibold text-[#31332c]">{displayName}</p>
                {email ? <p className="mt-1 text-xs text-[#5e6058]">{email}</p> : null}
              </div>

              <div className="mt-2 grid gap-1">
                <Link
                  className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#f5f4ed]"
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-[#5f5e5e]" />
                  Panou
                </Link>
                <Link
                  className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#f5f4ed]"
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-[#5f5e5e]" />
                  Setari
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
      </header>

      <main className="min-h-screen px-4 pb-28 pt-28 sm:px-6 lg:ml-64 lg:px-12 lg:pb-12">
        {pageMeta.showIntro ? (
          <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#735a42]">
                {pageMeta.eyebrow}
              </span>
              <h1 className="mt-2 font-serif text-5xl text-[#31332c]">{pageMeta.heading}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5e6058]">
                {pageMeta.description}
              </p>
            </div>
          </header>
        ) : null}

        {children}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around rounded-t-[2rem] border-t border-[#b1b3a9]/10 bg-[#ffffff]/90 px-4 pb-6 pt-3 shadow-[0px_-8px_24px_rgba(49,51,44,0.03)] backdrop-blur-xl lg:hidden">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href, item.href === "/admin");

          return (
            <Link
              key={item.href}
              className={clsx(
                "flex flex-col items-center justify-center rounded-full px-4 py-2 text-center transition-transform duration-200 active:scale-90",
                active ? "bg-[#ffdcbd] text-[#654d35]" : "text-[#31332c]/50",
              )}
              href={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </footer>
    </div>
  );
}

function PlusIcon() {
  return <span className="text-base leading-none">+</span>;
}
