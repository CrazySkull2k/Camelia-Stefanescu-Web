import { NextResponse, type NextRequest } from "next/server";

import { requireAdminAal2User } from "@/modules/auth/guards";
import { CMS_PREVIEW_COOKIE_NAME } from "@/modules/cms/service";
import { getCmsPageDefinition } from "@/modules/cms/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  await requireAdminAal2User();

  const { pageKey } = await params;
  const definition = getCmsPageDefinition(pageKey);

  if (!definition) {
    return new NextResponse("Pagina nu exista.", { status: 404 });
  }

  const previewUrl = new URL(definition.route, request.url);
  previewUrl.searchParams.set("cms_preview", "1");
  previewUrl.searchParams.set("previewed_page", pageKey);
  previewUrl.searchParams.set("t", String(Date.now()));

  const response = NextResponse.redirect(previewUrl);
  response.cookies.set(CMS_PREVIEW_COOKIE_NAME, pageKey, {
    httpOnly: true,
    maxAge: 60 * 15,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
