import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { getOptionalAdminUser } from "@/modules/auth/guards";
import { createBlogPostMutation } from "@/modules/blog/admin-mutations";

function getRequestIdentifier(request: Request, adminUserId: string) {
  return `${adminUserId}:${request.headers.get("x-forwarded-for") ?? "local"}`;
}

function buildRedirect(request: Request, input?: {
  error?: string | null;
  status?: string | null;
}) {
  const url = new URL("/admin/blog/new", request.url);

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
  try {
    assertAllowedOrigin(request.headers.get("origin"), "admin");
  } catch (error) {
    return NextResponse.redirect(
      buildRedirect(request, {
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
      identifier: getRequestIdentifier(request, adminUser.id),
      key: "admin-blog:create",
      max: 20,
      windowMs: 5 * 60 * 1000,
    });

    const formData = await request.formData();
    const result = await createBlogPostMutation({
      actorId: adminUser.id,
      formData,
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    revalidatePath(`/blog/${result.slug}`);

    return NextResponse.redirect(
      new URL(`/admin/blog/${result.id}?status=created`, request.url),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to create blog post from admin", {
      adminUserId: adminUser.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      buildRedirect(request, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut crea articolul.",
      }),
      { status: 303 },
    );
  }
}
