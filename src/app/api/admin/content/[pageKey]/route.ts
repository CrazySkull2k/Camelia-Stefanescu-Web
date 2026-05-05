import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { getOptionalAdminAal2User } from "@/modules/auth/guards";
import {
  discardPageDraftMutation,
  publishPageMutation,
  savePageDraftMutation,
} from "@/modules/cms/admin-mutations";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function buildEditorRedirect(request: Request, pageKey: string, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL(`/admin/content/${pageKey}`, request.url);

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
  context: { params: Promise<{ pageKey: string }> },
) {
  const { pageKey } = await context.params;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save").trim() || "save";

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildEditorRedirect(request, pageKey, {
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const adminUser = await getOptionalAdminAal2User();
  if (!adminUser) {
    return NextResponse.redirect(
      buildLoginRedirect(request, "Contul autentificat nu are acces admin."),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: `admin-content:${pageKey}:${intent}`,
      max: 30,
      windowMs: 5 * 60 * 1000,
    });

    if (intent === "publish") {
      const result = await publishPageMutation({
        actorId: adminUser.id,
        pageKey,
      });

      revalidatePath(result.definition.route);
      revalidatePath("/admin/content");
      revalidatePath(`/admin/content/${pageKey}`);

      return NextResponse.redirect(
        buildEditorRedirect(request, pageKey, { status: "published" }),
        { status: 303 },
      );
    }

    if (intent === "discard") {
      const result = await discardPageDraftMutation({
        actorId: adminUser.id,
        pageKey,
      });

      revalidatePath(result.definition.route);
      revalidatePath("/admin/content");
      revalidatePath(`/admin/content/${pageKey}`);

      return NextResponse.redirect(
        buildEditorRedirect(request, pageKey, { status: "draft-discarded" }),
        { status: 303 },
      );
    }

    const raw = String(formData.get("content_json") ?? "");
    const content = raw ? (JSON.parse(raw) as unknown) : {};
    const result = await savePageDraftMutation({
      actorId: adminUser.id,
      content,
      pageKey,
    });

    revalidatePath(result.definition.route);
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${pageKey}`);

    return NextResponse.redirect(
      buildEditorRedirect(request, pageKey, { status: "draft-saved" }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to process CMS admin mutation", {
      adminUserId: adminUser.id,
      error: error instanceof Error ? error.message : String(error),
      pageKey,
      intent,
    });

    return NextResponse.redirect(
      buildEditorRedirect(request, pageKey, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut procesa modificarile paginii.",
      }),
      { status: 303 },
    );
  }
}
