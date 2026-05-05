import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { appointmentStatusSchema } from "@/modules/appointments/schemas";
import { updateAppointmentByAdmin } from "@/modules/appointments/service";
import {
  getCurrentSessionUser,
  getOptionalOwnerAdminAal2User,
} from "@/modules/auth/guards";
import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { sanitizePlainText } from "@/lib/validation/sanitize";
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

  const adminUser = await getOptionalOwnerAdminAal2User();
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
      key: "admin-appointments:update",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    const formData = await request.formData();
    const status = appointmentStatusSchema.parse(String(formData.get("status") ?? "pending"));
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    const adminNotes = sanitizePlainText(String(formData.get("admin_notes") ?? ""));

    await updateAppointmentByAdmin({
      actorId: adminUser.id,
      adminNotes,
      appointmentId: id,
      date,
      status,
      time,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${id}`);

    return NextResponse.redirect(
      buildDetailRedirect(request, id, { status: "updated" }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to update appointment by admin API", {
      adminUserId: adminUser.id,
      appointmentId: id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildDetailRedirect(request, id, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut actualiza programarea.",
      }),
      { status: 303 },
    );
  }
}
