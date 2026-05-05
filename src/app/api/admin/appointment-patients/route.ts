import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import {
  createAdminPatientForAppointmentWizard,
  searchAdminAppointmentPatientsForWizard,
} from "@/modules/appointments/admin-wizard";
import {
  getCurrentSessionUser,
  getOptionalOwnerAdminUser,
} from "@/modules/auth/guards";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

export async function GET(request: Request) {
  try {
    const sessionUser = await getCurrentSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Autentificare admin necesara.", ok: false },
        { status: 401 },
      );
    }

    const adminUser = await getOptionalOwnerAdminUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Resursa solicitata nu a fost gasita.", ok: false },
        { status: 404 },
      );
    }

    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: "admin-appointment-patients:search",
      max: 60,
      windowMs: 5 * 60 * 1000,
    });

    const url = new URL(request.url);
    const result = await searchAdminAppointmentPatientsForWizard(url.searchParams.get("q") ?? "");

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    log("error", "Failed to search admin appointment patients", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Nu am putut incarca lista de pacienti.", ok: false },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");

    const sessionUser = await getCurrentSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Autentificare admin necesara.", ok: false },
        { status: 401 },
      );
    }

    const adminUser = await getOptionalOwnerAdminUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: "Resursa solicitata nu a fost gasita.", ok: false },
        { status: 404 },
      );
    }

    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: "admin-appointment-patients:create",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    const payload = (await request.json()) as unknown;
    const result = await createAdminPatientForAppointmentWizard(payload);

    if (result.ok) {
      revalidatePath("/admin/patients");
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    log("error", "Failed to create admin appointment patient", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Nu am putut crea pacientul.", ok: false },
      { status: 500 },
    );
  }
}
