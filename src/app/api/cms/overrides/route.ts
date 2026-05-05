import { NextResponse, type NextRequest } from "next/server";

import {
  CMS_IMAGE_OVERRIDES_SECTION,
  CMS_TEXT_OVERRIDES_SECTION,
  cmsPageDefinitions,
  type CmsImageOverride,
  type CmsTextOverride,
} from "@/modules/cms/registry";
import { getEditablePageContent } from "@/modules/cms/service";

function getPageKeyFromPath(path: string) {
  const normalizedPath = path === "" ? "/" : path.replace(/\/$/, "") || "/";

  return (
    cmsPageDefinitions.find((definition) => {
      const route = definition.route.replace(/\/$/, "") || "/";
      return route === normalizedPath;
    })?.pageKey ?? null
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  const requestedPreview = request.nextUrl.searchParams.get("preview") === "1";
  const previewedPage = request.nextUrl.searchParams.get("previewed_page");
  const pageKey = getPageKeyFromPath(path);

  if (!pageKey) {
    return NextResponse.json({
      imageOverrides: {},
      textOverrides: {},
    });
  }

  const content = await getEditablePageContent(pageKey, {
    preview: requestedPreview && previewedPage === pageKey,
  });
  const textOverrides = isRecord(content[CMS_TEXT_OVERRIDES_SECTION])
    ? (content[CMS_TEXT_OVERRIDES_SECTION] as Record<string, CmsTextOverride>)
    : {};
  const imageOverrides = isRecord(content[CMS_IMAGE_OVERRIDES_SECTION])
    ? (content[CMS_IMAGE_OVERRIDES_SECTION] as Record<string, CmsImageOverride>)
    : {};

  return NextResponse.json({
    imageOverrides,
    textOverrides,
  });
}
