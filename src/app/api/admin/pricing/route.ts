import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { getOptionalAdminUser } from "@/modules/auth/guards";
import {
  archivePricingEntityMutation,
  restorePricingEntityMutation,
  savePricingCategoryMutation,
  savePricingSectionMutation,
  savePricingServiceMutation,
  togglePricingVisibilityMutation,
} from "@/modules/pricing/admin-mutations";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function buildPricingRedirect(request: Request, input?: {
  categorySlug?: string | null;
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL("/admin/pricing", request.url);

  if (input?.categorySlug) {
    url.searchParams.set("categorie", input.categorySlug);
  }

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

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim();
  const categorySlug = String(formData.get("category_slug") ?? "").trim() || null;

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildPricingRedirect(request, {
        categorySlug,
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const adminUser = await getOptionalAdminUser();
  if (!adminUser) {
    return NextResponse.redirect(
      buildLoginRedirect(
        request,
        "Contul autentificat nu are acces admin.",
      ),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: `admin-pricing:${intent || "unknown"}`,
      max: 40,
      windowMs: 5 * 60 * 1000,
    });

    const result =
      intent === "save-category"
        ? await savePricingCategoryMutation({ actorId: adminUser.id, formData })
        : intent === "save-section"
          ? await savePricingSectionMutation({ actorId: adminUser.id, formData })
          : intent === "save-service"
            ? await savePricingServiceMutation({ actorId: adminUser.id, formData })
            : intent === "toggle-visibility"
              ? await togglePricingVisibilityMutation({ actorId: adminUser.id, formData })
              : intent === "archive"
                ? await archivePricingEntityMutation({ actorId: adminUser.id, formData })
                : intent === "restore"
                  ? await restorePricingEntityMutation({ actorId: adminUser.id, formData })
                  : null;

    if (!result) {
      throw new Error("Actiunea solicitata nu este suportata.");
    }

    revalidatePath("/admin/pricing");
    revalidatePath("/preturi");

    return NextResponse.redirect(
      buildPricingRedirect(request, {
        categorySlug: result.categorySlug ?? categorySlug,
        status: "saved",
      }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to process admin pricing mutation", {
      adminUserId: adminUser.id,
      error: error instanceof Error ? error.message : String(error),
      intent,
    });

    return NextResponse.redirect(
      buildPricingRedirect(request, {
        categorySlug,
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut salva modificarile de pricing.",
      }),
      { status: 303 },
    );
  }
}
