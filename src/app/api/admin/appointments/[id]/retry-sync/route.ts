import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { retryAppointmentCalendarSync } from "@/modules/appointments/service";
import {
  getCurrentSessionUser,
  getOptionalOwnerAdminUser,
} from "@/modules/auth/guards";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { isUuid } from "@/lib/validation/uuid";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function buildDetailRedirect(request: Request, appointmentId: string, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL(`/admin/appointments/${appointmentId}`, request.url);

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.redirect(
      buildDetailRedirect(request, id, {
        error: "Programarea solicitata nu a fost gasita.",
      }),
      { status: 303 },
    );
  }

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildDetailRedirect(request, id, {
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser) {
    return NextResponse.redirect(
      buildLoginRedirect(request, "Contul autentificat nu are acces admin."),
      { status: 303 },
    );
  }

  const adminUser = await getOptionalOwnerAdminUser();
  if (!adminUser) {
    return NextResponse.redirect(
      buildDetailRedirect(request, id, {
        error: "Programarea solicitata nu a fost gasita.",
      }),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: "admin-appointments:retry-sync",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    await retryAppointmentCalendarSync({
      actorId: adminUser.id,
      appointmentId: id,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${id}`);

    return NextResponse.redirect(
      buildDetailRedirect(request, id, { status: "sync-retried" }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to retry appointment calendar sync", {
      adminUserId: adminUser.id,
      appointmentId: id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildDetailRedirect(request, id, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut reincepe sincronizarea.",
      }),
      { status: 303 },
    );
  }
}
