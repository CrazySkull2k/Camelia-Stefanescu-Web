import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { getOptionalAdminAal2User } from "@/modules/auth/guards";
import {
  getCalendarBlockMutationErrorResponse,
  saveAdminCalendarBlock,
} from "@/modules/calendar-blocks/admin-mutations";

export async function POST(request: Request) {
  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");

  const adminUser = await getOptionalAdminAal2User();

    if (!adminUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Autentificare admin necesara.",
        },
        { status: 401 },
      );
    }

    await applyRateLimit({
      identifier: `${adminUser.id}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "admin-calendar-blocks:save",
      max: 30,
      windowMs: 5 * 60 * 1000,
    });

    const formData = await request.formData();
    const savedIds = await saveAdminCalendarBlock({
      adminUserId: adminUser.id,
      formData,
    });

    return NextResponse.json({
      ids: savedIds,
      message: "Block-ul a fost salvat.",
      ok: true,
    });
  } catch (error) {
    const errorResponse = getCalendarBlockMutationErrorResponse(error);

    log("error", "Failed to save admin calendar block", {
      code: errorResponse.code,
      error: errorResponse.internalMessage,
      status: errorResponse.status,
    });

    return NextResponse.json(
      {
        message: errorResponse.message,
        ok: false,
      },
      { status: errorResponse.status },
    );
  }
}
