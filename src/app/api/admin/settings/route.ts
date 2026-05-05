import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { writeAuditLog } from "@/modules/audit/service";
import { getOptionalAdminUser } from "@/modules/auth/guards";
import { updateClinicSettings } from "@/modules/settings/service";
import {
  clinicWeekdays,
  defaultAppointmentSchedule,
  normalizeClinicSchedule,
  timeToMinutes,
  type ClinicAppointmentSchedule,
} from "@/modules/settings/schedule";

function buildSettingsRedirect(request: Request, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL("/admin/settings", request.url);

  if (input?.status) {
    url.searchParams.set("status", input.status);
  }

  if (input?.error) {
    url.searchParams.set("error", input.error);
  }

  return url;
}

function buildLoginRedirect(request: Request, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  return url;
}

function getScheduleFromForm(formData: FormData): ClinicAppointmentSchedule {
  const rawSchedule = clinicWeekdays.reduce<Record<string, unknown>>(
    (schedule, weekday) => {
      const fallback = defaultAppointmentSchedule[weekday.key];
      const start = String(formData.get(`schedule_${weekday.key}_start`) ?? fallback.start);
      const end = String(formData.get(`schedule_${weekday.key}_end`) ?? fallback.end);
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);

      schedule[weekday.key] = {
        enabled:
          String(formData.get(`schedule_${weekday.key}_enabled`) ?? "") === "on" &&
          startMinutes !== null &&
          endMinutes !== null &&
          endMinutes > startMinutes,
        end,
        start,
      };

      return schedule;
    },
    {},
  );

  return normalizeClinicSchedule(rawSchedule);
}

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildSettingsRedirect(request, {
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const adminUser = await getOptionalAdminUser();
  if (!adminUser) {
    return NextResponse.redirect(
      buildLoginRedirect(request, "Contul autentificat nu are acces admin."),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: `${adminUser.id}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "admin-settings:update",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    const formData = await request.formData();
    const appointmentSchedule = getScheduleFromForm(formData);
    const requireManualAppointmentConfirmation =
      String(formData.get("require_manual_appointment_confirmation") ?? "") === "on";

    await updateClinicSettings({
      appointmentSchedule,
      requireManualAppointmentConfirmation,
    });

    await writeAuditLog({
      action: "clinic_settings.updated",
      actorId: adminUser.id,
      after: {
        enabledDays: clinicWeekdays.filter(
          (weekday) => appointmentSchedule[weekday.key].enabled,
        ).length,
        requireManualAppointmentConfirmation,
      },
      entityId: "clinic_settings",
      entityType: "clinic_settings",
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/appointments/new");
    revalidatePath("/programare");

    return NextResponse.redirect(
      buildSettingsRedirect(request, { status: "saved" }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to update clinic settings through BFF route", {
      adminUserId: adminUser.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildSettingsRedirect(request, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut salva setarile.",
      }),
      { status: 303 },
    );
  }
}
