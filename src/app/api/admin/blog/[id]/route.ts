import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { deleteBlogPostMutation, updateBlogPostMutation } from "@/modules/blog/admin-mutations";
import { getOptionalAdminUser } from "@/modules/auth/guards";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function buildEditorRedirect(request: Request, postId: string, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL(`/admin/blog/${postId}`, request.url);

  if (input?.status) {
    url.searchParams.set("status", input.status);
  }

  if (input?.error) {
    url.searchParams.set("error", input.error);
  }

  return url;
}

function buildListRedirect(request: Request, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL("/admin/blog", request.url);

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

  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildEditorRedirect(request, id, {
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

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim() || "update";

  try {
    await applyRateLimit({
      identifier: getRequestIdentifier(request, adminUser.id),
      key: `admin-blog:${intent}`,
      max: 25,
      windowMs: 5 * 60 * 1000,
    });

    if (intent === "delete") {
      const result = await deleteBlogPostMutation({
        actorId: adminUser.id,
        postId: id,
      });

      revalidatePath("/blog");
      revalidatePath("/admin/blog");

      if (result.slug) {
        revalidatePath(`/blog/${result.slug}`);
      }

      return NextResponse.redirect(buildListRedirect(request, { status: "deleted" }), {
        status: 303,
      });
    }

    const result = await updateBlogPostMutation({
      actorId: adminUser.id,
      formData,
      postId: id,
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    revalidatePath(`/blog/${result.slug}`);

    if (result.previousSlug && result.previousSlug !== result.slug) {
      revalidatePath(`/blog/${result.previousSlug}`);
    }

    return NextResponse.redirect(
      buildEditorRedirect(request, id, { status: "updated" }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to process admin blog mutation", {
      adminUserId: adminUser.id,
      error: error instanceof Error ? error.message : String(error),
      intent,
      postId: id,
    });

    return NextResponse.redirect(
      buildEditorRedirect(request, id, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut actualiza articolul.",
      }),
      { status: 303 },
    );
  }
}
