"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { ChevronUp } from "lucide-react";
import clsx from "clsx";

type TodayAppointment = {
  href: string;
  id: string;
  label: string;
  service: string;
  status: string;
  statusLabel: string;
  time: string;
};

type AdminDashboardTodayDrawerProps = {
  appointments: TodayAppointment[];
  children: ReactNode;
  totalCount: number;
};

function statusClass(value: string) {
  if (value === "confirmed") {
    return "bg-[#f9f3ea] text-[#5f5b55]";
  }

  if (value === "pending") {
    return "bg-[#ffdcbd] text-[#654d35]";
  }

  if (value === "cancelled") {
    return "bg-[#fe8983]/55 text-[#752121]";
  }

  return "bg-[#e2e3d9] text-[#5e6058]";
}

export function AdminDashboardTodayDrawer({
  appointments,
  children,
  totalCount,
}: AdminDashboardTodayDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative min-h-[34rem] overflow-hidden rounded-[2.5rem] bg-[#31332c] p-7 text-[#faf7f6] shadow-[0px_18px_44px_rgba(49,51,44,0.16)] md:p-9">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#ffdcbd]/15 blur-2xl" />

      <div
        className={clsx(
          "relative z-10 flex min-h-[29rem] flex-col pb-20 transition-transform duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "-translate-y-[38rem] scale-[0.99]"
            : "translate-y-0 scale-100",
        )}
      >
        {children}
      </div>

      <div
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b from-[#31332c] via-[#31332c] to-transparent transition-opacity duration-500",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={clsx(
          "absolute inset-x-7 bottom-7 z-30 overflow-hidden rounded-[2rem] transition-[top,background-color,box-shadow,ring-color] duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-x-9 md:bottom-9",
          open
            ? "top-7 bg-[#252720] text-[#faf7f6] shadow-[0px_24px_54px_rgba(14,14,12,0.28)] ring-1 ring-[#ffdcbd]/15 md:top-9"
            : "top-[calc(100%-5rem)] bg-[#faf7f6]/10 text-[#faf7f6] ring-1 ring-white/10 md:top-[calc(100%-5.25rem)]",
        )}
      >
        <button
          aria-expanded={open}
          className={clsx(
            "flex w-full items-center justify-between gap-4 px-5 text-sm font-bold transition-[padding,color,background-color] duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "py-5 text-[#faf7f6]" : "py-3 text-[#faf7f6] hover:bg-[#faf7f6]/10",
          )}
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          <span>
            <span
              className={clsx(
                "block text-left transition-all duration-700",
                open
                  ? "text-[10px] uppercase tracking-[0.2em] text-[#ffdcbd]"
                  : "text-sm text-[#faf7f6]",
              )}
            >
              Programarile de azi
            </span>
            <span
              className={clsx(
                "mt-1 text-left text-sm font-semibold text-[#faf7f6]/58 transition-all duration-700",
                open ? "block opacity-100" : "hidden opacity-0",
              )}
            >
              {totalCount} in calendarul cabinetului
            </span>
          </span>

          <span
            className={clsx(
              "flex items-center gap-2 transition-colors duration-700",
              open ? "text-[#ffdcbd]" : "text-[#ffdcbd]",
            )}
          >
            {!open ? totalCount : null}
            <ChevronUp
              className={clsx(
                "h-5 w-5 transition-transform duration-[760ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                open && "rotate-180",
              )}
            />
          </span>
        </button>

        <div
          className={clsx(
            "grid overflow-y-auto px-3 pb-3 transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            open
              ? "max-h-[calc(100%-5.75rem)] translate-y-0 opacity-100 delay-150"
              : "max-h-0 translate-y-8 opacity-0",
          )}
        >
          {appointments.length ? (
            <div className="grid gap-2">
              {appointments.map((appointment, index) => (
                <Link
                  className="group grid gap-3 rounded-2xl bg-[#31332c] px-4 py-3 ring-1 ring-white/8 transition duration-300 hover:bg-[#383a33] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  href={appointment.href}
                  key={appointment.id}
                  style={{
                    transitionDelay: open ? `${160 + index * 45}ms` : "0ms",
                  }}
                >
                  <span className="font-serif text-2xl leading-none text-[#faf7f6]">
                    {appointment.time}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#faf7f6]">
                      {appointment.label}
                    </span>
                    <span className="block truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#faf7f6]/48">
                      {appointment.service}
                    </span>
                  </span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusClass(
                      appointment.status,
                    )}`}
                  >
                    {appointment.statusLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#31332c] px-4 py-8 text-center text-sm font-semibold text-[#faf7f6]/58 ring-1 ring-white/8">
              Nu exista programari pentru azi.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
