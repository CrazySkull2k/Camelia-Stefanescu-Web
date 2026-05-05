import "server-only";

import { cookies } from "next/headers";

import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOptionalAdminAal2User } from "@/modules/auth/guards";
import {
  cloneCmsContent,
  cmsPageDefinitions,
  getCmsPageDefinition,
  type CmsPageContent,
} from "@/modules/cms/registry";
import { validateCmsContent } from "@/modules/cms/validation";

export const CMS_PREVIEW_COOKIE_NAME = "__Host-camelia_cms_preview_page";

type SectionRow = {
  content?: unknown;
  draft_content?: unknown;
  is_published?: boolean | null;
  published_at?: string | null;
  section_key: string;
  updated_at?: string | null;
};

function sectionsToContent(
  sections: SectionRow[] | null | undefined,
  source: "content" | "draft_content",
) {
  return Object.fromEntries(
    (sections ?? [])
      .filter((section) => section[source] && typeof section[source] === "object")
      .map((section) => [section.section_key, section[source]]),
  );
}

async function getPreviewDraftContent(pageKey: string) {
  const cookieStore = await cookies();
  const previewPageKey = cookieStore.get(CMS_PREVIEW_COOKIE_NAME)?.value;

  if (previewPageKey !== pageKey) {
    return null;
  }

  const user = await getOptionalAdminAal2User();

  if (!user) {
    return null;
  }

  const definition = getCmsPageDefinition(pageKey);

  if (!definition) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: page } = await supabase
    .from("site_pages")
    .select("id")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (!page?.id) {
    return null;
  }

  const { data: sections } = await supabase
    .from("site_sections")
    .select("section_key, draft_content")
    .eq("page_id", page.id);
  const draftRaw = sectionsToContent(sections as SectionRow[], "draft_content");

  if (!Object.keys(draftRaw).length) {
    return null;
  }

  return validateCmsContent(definition, draftRaw);
}

export async function getEditablePageContent(
  pageKey: string,
  options: { preview?: boolean } = {},
): Promise<CmsPageContent> {
  const definition = getCmsPageDefinition(pageKey);
  if (!definition || !hasServerEnv()) {
    return definition ? cloneCmsContent(definition.defaultContent) : {};
  }

  try {
    const previewDraftContent = options.preview
      ? await getPreviewDraftContent(pageKey)
      : null;

    if (previewDraftContent) {
      return previewDraftContent;
    }

    const supabase = await createSupabaseServerClient();
    const { data: page } = await supabase
      .from("site_pages")
      .select("id")
      .eq("page_key", pageKey)
      .eq("is_published", true)
      .maybeSingle();

    if (!page?.id) {
      return cloneCmsContent(definition.defaultContent);
    }

    const { data: sections } = await supabase
      .from("site_sections")
      .select("section_key, content")
      .eq("page_id", page.id)
      .eq("is_published", true);

    return validateCmsContent(definition, sectionsToContent(sections as SectionRow[], "content"));
  } catch {
    return cloneCmsContent(definition.defaultContent);
  }
}

export async function getAdminPageEditorState(pageKey: string) {
  const definition = getCmsPageDefinition(pageKey);
  if (!definition || !hasServerEnv()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: page } = await supabase
    .from("site_pages")
    .select("id, title, page_key, slug, is_published, updated_at")
    .eq("page_key", pageKey)
    .maybeSingle();

  const { data: sections } = page?.id
    ? await supabase
        .from("site_sections")
        .select(
          "section_key, content, draft_content, is_published, published_at, updated_at",
        )
        .eq("page_id", page.id)
    : { data: [] };

  const publishedContent = validateCmsContent(
    definition,
    sectionsToContent(sections as SectionRow[], "content"),
  );
  const draftRaw = sectionsToContent(sections as SectionRow[], "draft_content");
  const hasDraft = Object.keys(draftRaw).length > 0;
  const draftContent = hasDraft ? validateCmsContent(definition, draftRaw) : null;

  return {
    definition,
    draftContent,
    editContent: draftContent ?? publishedContent,
    hasDraft,
    hasPublished: Boolean(
      page?.is_published && (sections as SectionRow[] | null | undefined)?.some((section) => section.is_published),
    ),
    page,
    publishedContent,
  };
}

export async function getAdminContentOverview() {
  if (!hasServerEnv()) {
    return cmsPageDefinitions.map((definition) => ({
      definition,
      hasDraft: false,
      hasPublished: false,
      updatedAt: null as string | null,
    }));
  }

  const supabase = createSupabaseAdminClient();
  const { data: pages } = await supabase
    .from("site_pages")
    .select("id, page_key, is_published, updated_at")
    .in(
      "page_key",
      cmsPageDefinitions.map((definition) => definition.pageKey),
    );
  const pageIds = (pages ?? []).map((page) => page.id);
  const { data: sections } = pageIds.length
    ? await supabase
        .from("site_sections")
        .select("page_id, draft_content, is_published, updated_at")
        .in("page_id", pageIds)
    : { data: [] };

  return cmsPageDefinitions.map((definition) => {
    const page = pages?.find((item) => item.page_key === definition.pageKey);
    const pageSections = page
      ? (sections ?? []).filter((section) => section.page_id === page.id)
      : [];

    return {
      definition,
      hasDraft: pageSections.some((section) => Boolean(section.draft_content)),
      hasPublished: Boolean(page?.is_published && pageSections.some((section) => section.is_published)),
      updatedAt:
        pageSections
          .map((section) => section.updated_at)
          .filter(Boolean)
          .sort()
          .at(-1) ?? page?.updated_at ?? null,
    };
  });
}
