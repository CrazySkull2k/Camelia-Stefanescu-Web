import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/modules/audit/service";
import {
  CMS_IMAGE_OVERRIDES_SECTION,
  CMS_TEXT_OVERRIDES_SECTION,
  cloneCmsContent,
  getCmsPageDefinition,
  type CmsPageDefinition,
} from "@/modules/cms/registry";
import { validateCmsContent } from "@/modules/cms/validation";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type SiteSectionRow = {
  content: unknown;
  draft_content?: unknown;
  id: string;
  section_key: string;
};

const CMS_SYSTEM_SECTIONS = [
  { key: CMS_TEXT_OVERRIDES_SECTION, sortOrder: 1000 },
  { key: CMS_IMAGE_OVERRIDES_SECTION, sortOrder: 1001 },
] as const;

function getPageTitle(
  definition: CmsPageDefinition,
  content: ReturnType<typeof validateCmsContent>,
) {
  const heroTitle = content.hero?.title;
  return typeof heroTitle === "string" && heroTitle.trim()
    ? heroTitle.trim().slice(0, 180)
    : definition.label;
}

async function getOrCreatePage(
  supabase: SupabaseAdminClient,
  definition: CmsPageDefinition,
  title: string,
) {
  const { data: existingPage, error: existingError } = await supabase
    .from("site_pages")
    .select("id")
    .eq("page_key", definition.pageKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingPage?.id) {
    const { error } = await supabase
      .from("site_pages")
      .update({
        slug: definition.route,
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPage.id);

    if (error) {
      throw new Error(error.message);
    }

    return String(existingPage.id);
  }

  const { data: createdPage, error } = await supabase
    .from("site_pages")
    .insert({
      is_published: false,
      page_key: definition.pageKey,
      slug: definition.route,
      title,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !createdPage?.id) {
    throw new Error(error?.message ?? "Pagina CMS nu a putut fi creata.");
  }

  return String(createdPage.id);
}

async function getSections(supabase: SupabaseAdminClient, pageId: string) {
  const { data, error } = await supabase
    .from("site_sections")
    .select("id, section_key, content, draft_content")
    .eq("page_id", pageId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SiteSectionRow[];
}

function getRawSectionMap(sections: SiteSectionRow[]) {
  return Object.fromEntries(
    sections.map((section) => [
      section.section_key,
      section.draft_content ?? section.content ?? {},
    ]),
  );
}

async function upsertSectionDraft({
  existingSections,
  pageId,
  sectionContent,
  sectionKey,
  sortOrder,
  supabase,
  now,
}: {
  existingSections: SiteSectionRow[];
  now: string;
  pageId: string;
  sectionContent: unknown;
  sectionKey: string;
  sortOrder: number;
  supabase: SupabaseAdminClient;
}) {
  const existingSection = existingSections.find((item) => item.section_key === sectionKey);

  if (existingSection?.id) {
    const { error } = await supabase
      .from("site_sections")
      .update({
        draft_content: sectionContent,
        draft_updated_at: now,
        section_type: sectionKey.startsWith("__") ? "system" : "structured",
        sort_order: sortOrder,
        updated_at: now,
      })
      .eq("id", existingSection.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("site_sections").insert({
    content: {},
    draft_content: sectionContent,
    draft_updated_at: now,
    is_published: false,
    page_id: pageId,
    section_key: sectionKey,
    section_type: sectionKey.startsWith("__") ? "system" : "structured",
    sort_order: sortOrder,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertPublishedSection({
  existingSections,
  pageId,
  sectionContent,
  sectionKey,
  sortOrder,
  supabase,
  now,
}: {
  existingSections: SiteSectionRow[];
  now: string;
  pageId: string;
  sectionContent: unknown;
  sectionKey: string;
  sortOrder: number;
  supabase: SupabaseAdminClient;
}) {
  const existingSection = existingSections.find((item) => item.section_key === sectionKey);

  if (existingSection?.id) {
    const { error } = await supabase
      .from("site_sections")
      .update({
        content: sectionContent,
        draft_content: null,
        draft_updated_at: null,
        is_published: true,
        published_at: now,
        section_type: sectionKey.startsWith("__") ? "system" : "structured",
        sort_order: sortOrder,
        updated_at: now,
      })
      .eq("id", existingSection.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("site_sections").insert({
    content: sectionContent,
    draft_content: null,
    draft_updated_at: null,
    is_published: true,
    page_id: pageId,
    published_at: now,
    section_key: sectionKey,
    section_type: sectionKey.startsWith("__") ? "system" : "structured",
    sort_order: sortOrder,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function savePageDraftMutation(input: {
  actorId: string;
  content: unknown;
  pageKey: string;
}) {
  const definition = getCmsPageDefinition(input.pageKey);
  if (!definition) {
    throw new Error("Pagina CMS nu este configurata.");
  }

  const content = validateCmsContent(definition, input.content);
  const supabase = createSupabaseAdminClient();
  const pageId = await getOrCreatePage(
    supabase,
    definition,
    getPageTitle(definition, content),
  );
  const existingSections = await getSections(supabase, pageId);
  const now = new Date().toISOString();

  for (const [index, section] of definition.sections.entries()) {
    await upsertSectionDraft({
      existingSections,
      now,
      pageId,
      sectionContent: content[section.key] ?? {},
      sectionKey: section.key,
      sortOrder: index + 1,
      supabase,
    });
  }

  for (const section of CMS_SYSTEM_SECTIONS) {
    await upsertSectionDraft({
      existingSections,
      now,
      pageId,
      sectionContent: content[section.key] ?? {},
      sectionKey: section.key,
      sortOrder: section.sortOrder,
      supabase,
    });
  }

  await writeAuditLog({
    action: "cms-draft-saved",
    actorId: input.actorId,
    after: { pageKey: definition.pageKey },
    entityId: pageId,
    entityType: "cms_page",
  });

  return { definition, pageId };
}

export async function publishPageMutation(input: {
  actorId: string;
  pageKey: string;
}) {
  const definition = getCmsPageDefinition(input.pageKey);
  if (!definition) {
    throw new Error("Pagina CMS nu este configurata.");
  }

  const supabase = createSupabaseAdminClient();
  const pageId = await getOrCreatePage(supabase, definition, definition.label);
  const existingSections = await getSections(supabase, pageId);
  const now = new Date().toISOString();
  const defaults = cloneCmsContent(definition.defaultContent);
  const rawSource = {
    ...defaults,
    ...getRawSectionMap(existingSections),
  };
  const fullContent = validateCmsContent(definition, rawSource);

  for (const [index, section] of definition.sections.entries()) {
    await upsertPublishedSection({
      existingSections,
      now,
      pageId,
      sectionContent: fullContent[section.key] ?? {},
      sectionKey: section.key,
      sortOrder: index + 1,
      supabase,
    });
  }

  for (const section of CMS_SYSTEM_SECTIONS) {
    await upsertPublishedSection({
      existingSections,
      now,
      pageId,
      sectionContent: fullContent[section.key] ?? {},
      sectionKey: section.key,
      sortOrder: section.sortOrder,
      supabase,
    });
  }

  const { error } = await supabase
    .from("site_pages")
    .update({
      is_published: true,
      slug: definition.route,
      title: definition.label,
      updated_at: now,
    })
    .eq("id", pageId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "cms-page-published",
    actorId: input.actorId,
    after: { pageKey: definition.pageKey, publishedAt: now },
    entityId: pageId,
    entityType: "cms_page",
  });

  return { definition, pageId };
}

export async function discardPageDraftMutation(input: {
  actorId: string;
  pageKey: string;
}) {
  const definition = getCmsPageDefinition(input.pageKey);
  if (!definition) {
    throw new Error("Pagina CMS nu este configurata.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: page, error: pageError } = await supabase
    .from("site_pages")
    .select("id")
    .eq("page_key", definition.pageKey)
    .maybeSingle();

  if (pageError) {
    throw new Error(pageError.message);
  }

  if (page?.id) {
    const { error } = await supabase
      .from("site_sections")
      .update({
        draft_content: null,
        draft_updated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("page_id", page.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      action: "cms-draft-discarded",
      actorId: input.actorId,
      after: { pageKey: definition.pageKey },
      entityId: String(page.id),
      entityType: "cms_page",
    });
  }

  return { definition, pageId: page?.id ?? null };
}
