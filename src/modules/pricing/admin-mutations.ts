import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { writeAuditLog } from "@/modules/audit/service";

export type PricingEntity = "category" | "section" | "service";

function getText(formData: FormData, key: string, fallback = "") {
  return sanitizePlainText(String(formData.get(key) ?? fallback)).trim();
}

function getSlug(formData: FormData, key: string, fallback: string) {
  return slugify(String(formData.get(key) ?? fallback));
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseFloat(String(formData.get(key) ?? ""));
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : fallback;
}

function getInteger(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : fallback;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getFeatureBullets(formData: FormData) {
  return String(formData.get("feature_bullets") ?? "")
    .split(/\r?\n|\s*\|\s*/)
    .map((item) => sanitizePlainText(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function getCategorySlug(categoryId: string) {
  if (!categoryId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("service_categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();

  return typeof data?.slug === "string" ? data.slug : null;
}

async function validateCategory(categoryId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, slug")
    .eq("id", categoryId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Categoria selectata nu exista sau este arhivata.");
  }

  return data as { id: string; slug: string };
}

async function validateSection(sectionId: string, categoryId: string) {
  if (!sectionId) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pricing_sections")
    .select("id, category_id")
    .eq("id", sectionId)
    .eq("category_id", categoryId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return String(data.id);
}

export async function savePricingCategoryMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const name = getText(input.formData, "name");
  const slug = getSlug(input.formData, "slug", name);
  const id = getText(input.formData, "id") || slug;

  if (!name || !slug) {
    throw new Error("Categoria are nevoie de nume si slug.");
  }

  const description = getText(input.formData, "description") || null;
  const isVisible = getBoolean(input.formData, "is_visible");
  const sortOrder = getInteger(input.formData, "sort_order", 1);
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("service_categories").upsert({
    archived_at: null,
    description,
    id,
    is_visible: isVisible,
    name,
    slug,
    sort_order: sortOrder,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "pricing-category-saved",
    actorId: input.actorId,
    after: { description, isVisible, name, slug, sortOrder },
    entityId: id,
    entityType: "pricing_category",
  });

  return { categorySlug: slug };
}

export async function savePricingSectionMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const categoryId = getText(input.formData, "category_id");
  const category = await validateCategory(categoryId);
  const title = getText(input.formData, "title");
  const slug = getSlug(input.formData, "slug", title || "sectiune");
  const id = getText(input.formData, "id") || `${category.id}-${slug}`;

  if (!slug) {
    throw new Error("Sectiunea are nevoie de slug.");
  }

  const description = getText(input.formData, "description") || null;
  const isVisible = getBoolean(input.formData, "is_visible");
  const sortOrder = getInteger(input.formData, "sort_order", 1);
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("pricing_sections").upsert({
    archived_at: null,
    category_id: category.id,
    description,
    id,
    is_visible: isVisible,
    slug,
    sort_order: sortOrder,
    title: title || null,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "pricing-section-saved",
    actorId: input.actorId,
    after: {
      categoryId: category.id,
      description,
      isVisible,
      slug,
      sortOrder,
      title: title || null,
    },
    entityId: id,
    entityType: "pricing_section",
  });

  return { categorySlug: category.slug };
}

export async function savePricingServiceMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const categoryId = getText(input.formData, "category_id");
  const category = await validateCategory(categoryId);
  const sectionId = await validateSection(
    getText(input.formData, "pricing_section_id"),
    category.id,
  );
  const name = getText(input.formData, "name");
  const slug = getSlug(input.formData, "slug", name);
  const id = getText(input.formData, "id") || slug;
  const featureBullets = getFeatureBullets(input.formData);

  if (!name || !slug) {
    throw new Error("Serviciul are nevoie de nume si slug.");
  }

  const ctaLabel = getText(input.formData, "cta_label") || null;
  const currencyCode = getText(input.formData, "currency_code", "RON") || "RON";
  const durationMinutes = getInteger(input.formData, "duration_minutes", 0) || null;
  const isBookable = getBoolean(input.formData, "is_bookable");
  const isVisible = getBoolean(input.formData, "is_visible");
  const notes = getText(input.formData, "notes") || null;
  const priceAmount = getNumber(input.formData, "price_amount", 0);
  const sortOrder = getInteger(input.formData, "sort_order", 1);
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("service_offerings").upsert({
    archived_at: null,
    category_id: category.id,
    cta_label: ctaLabel,
    currency_code: currencyCode,
    description: featureBullets.join(" | ") || null,
    duration_minutes: durationMinutes,
    feature_bullets: featureBullets,
    id,
    is_bookable: isBookable,
    is_visible: isVisible,
    name,
    notes,
    price_amount: priceAmount,
    pricing_section_id: sectionId,
    slug,
    sort_order: sortOrder,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "pricing-service-saved",
    actorId: input.actorId,
    after: {
      categoryId: category.id,
      ctaLabel,
      currencyCode,
      durationMinutes,
      featureBullets,
      isBookable,
      isVisible,
      name,
      notes,
      priceAmount,
      pricingSectionId: sectionId,
      slug,
      sortOrder,
    },
    entityId: id,
    entityType: "pricing_service",
  });

  return { categorySlug: category.slug };
}

export async function togglePricingVisibilityMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const entity = getText(input.formData, "entity") as PricingEntity;
  const id = getText(input.formData, "id");
  const nextVisible = getBoolean(input.formData, "next_visible");
  const categorySlug = getText(input.formData, "category_slug");
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const table =
    entity === "category"
      ? "service_categories"
      : entity === "section"
        ? "pricing_sections"
        : "service_offerings";

  const { error } = await supabase
    .from(table)
    .update({
      is_visible: nextVisible,
      updated_at: now,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "pricing-visibility-updated",
    actorId: input.actorId,
    after: { entity, isVisible: nextVisible },
    entityId: id,
    entityType: entity,
  });

  return {
    categorySlug:
      categorySlug ||
      (entity === "category" ? undefined : (await getCategorySlug(id)) ?? undefined),
  };
}

export async function archivePricingEntityMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const entity = getText(input.formData, "entity") as PricingEntity;
  const id = getText(input.formData, "id");
  const categorySlug = getText(input.formData, "category_slug");
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  if (entity === "category") {
    const { error } = await supabase
      .from("service_categories")
      .update({ archived_at: now, is_visible: false, updated_at: now })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from("pricing_sections")
      .update({ archived_at: now, is_visible: false, updated_at: now })
      .eq("category_id", id)
      .is("archived_at", null);
    await supabase
      .from("service_offerings")
      .update({
        archived_at: now,
        is_bookable: false,
        is_visible: false,
        updated_at: now,
      })
      .eq("category_id", id)
      .is("archived_at", null);
  } else if (entity === "section") {
    const { error } = await supabase
      .from("pricing_sections")
      .update({ archived_at: now, is_visible: false, updated_at: now })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from("service_offerings")
      .update({
        archived_at: now,
        is_bookable: false,
        is_visible: false,
        updated_at: now,
      })
      .eq("pricing_section_id", id)
      .is("archived_at", null);
  } else {
    const { error } = await supabase
      .from("service_offerings")
      .update({
        archived_at: now,
        is_bookable: false,
        is_visible: false,
        updated_at: now,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  await writeAuditLog({
    action: "pricing-entity-archived",
    actorId: input.actorId,
    after: { archivedAt: now, entity },
    entityId: id,
    entityType: entity,
  });

  return { categorySlug: categorySlug || undefined };
}

export async function restorePricingEntityMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const entity = getText(input.formData, "entity") as PricingEntity;
  const id = getText(input.formData, "id");
  const categorySlug = getText(input.formData, "category_slug");
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  if (entity === "category") {
    const { error } = await supabase
      .from("service_categories")
      .update({ archived_at: null, updated_at: now })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from("pricing_sections")
      .update({ archived_at: null, updated_at: now })
      .eq("category_id", id);
    await supabase
      .from("service_offerings")
      .update({ archived_at: null, updated_at: now })
      .eq("category_id", id);
  } else if (entity === "section") {
    const { error } = await supabase
      .from("pricing_sections")
      .update({ archived_at: null, updated_at: now })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from("service_offerings")
      .update({ archived_at: null, updated_at: now })
      .eq("pricing_section_id", id);
  } else {
    const { error } = await supabase
      .from("service_offerings")
      .update({ archived_at: null, updated_at: now })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  await writeAuditLog({
    action: "pricing-entity-restored",
    actorId: input.actorId,
    after: { entity, restoredAt: now },
    entityId: id,
    entityType: entity,
  });

  return { categorySlug: categorySlug || undefined };
}
