import "server-only";

import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  legacyPricingSections,
  legacyServiceCategories,
  legacyServiceOfferings,
} from "@/modules/pricing/data";
import type {
  PricingCatalogCategory,
  PricingCategory,
  PricingSection,
  ServiceOffering,
} from "@/modules/pricing/types";

function parseFeatures(
  featureBullets?: string[] | null,
  description?: string | null,
) {
  if (Array.isArray(featureBullets) && featureBullets.length) {
    return featureBullets.map((feature) => feature.trim()).filter(Boolean);
  }

  return (description ?? "")
    .split(/\s*\|\s*|\n+/)
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function formatPriceAmount(amount: number) {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function formatPriceLabel(priceAmount: number, currencyCode: string) {
  if (currencyCode.toUpperCase() === "RON") {
    return `${formatPriceAmount(priceAmount)} lei`;
  }

  return `${formatPriceAmount(priceAmount)} ${currencyCode}`;
}

function unwrapRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function getPricingClient(admin = false) {
  if (admin) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}

function getDefaultPricingSection(categoryId: string): PricingSection {
  return (
    legacyPricingSections.find((section) => section.categoryId === categoryId) ?? {
      id: `${categoryId}-default`,
      categoryId,
      slug: "default",
      visible: true,
      sortOrder: 1,
    }
  );
}

function buildPricingCatalog(
  categories: PricingCategory[],
  sections: PricingSection[],
  services: ServiceOffering[],
  options: { includeEmpty?: boolean } = {},
): PricingCatalogCategory[] {
  return categories
    .map((category) => {
      const sectionMap = new Map<string, PricingCatalogCategory["sections"][number]>();

      sections
        .filter((section) => section.categoryId === category.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .forEach((section) => {
          sectionMap.set(section.id, {
            ...section,
            items: [],
          });
        });

      services
        .filter((service) => service.categoryId === category.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .forEach((service) => {
          const defaultSection = getDefaultPricingSection(category.id);
          const sectionId =
            service.pricingSectionId && sectionMap.has(service.pricingSectionId)
              ? service.pricingSectionId
              : defaultSection.id;

          if (service.pricingSectionId && !sectionMap.has(service.pricingSectionId)) {
            return;
          }

          if (!sectionMap.has(sectionId)) {
            sectionMap.set(sectionId, {
              ...defaultSection,
              id: sectionId,
              items: [],
            });
          }

          sectionMap.get(sectionId)!.items.push(service);
        });

      const groupedSections = Array.from(sectionMap.values())
        .filter((section) => options.includeEmpty || section.items.length > 0)
        .sort((left, right) => left.sortOrder - right.sortOrder);

      return {
        ...category,
        sections: groupedSections,
      };
    })
    .filter((category) => options.includeEmpty || category.sections.length > 0);
}

export async function ensureServiceOfferingPersisted(
  offering: ServiceOffering,
): Promise<string | null> {
  if (!hasServerEnv()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingOffering } = await supabase
    .from("service_offerings")
    .select("id")
    .eq("id", offering.id)
    .maybeSingle();

  if (existingOffering?.id) {
    return String(existingOffering.id);
  }

  const category = legacyServiceCategories.find(
    (entry) => entry.id === offering.categoryId,
  );

  if (!category) {
    return null;
  }

  const section = legacyPricingSections.find(
    (entry) => entry.id === offering.pricingSectionId,
  );

  const categoryUpsert = await supabase.from("service_categories").upsert({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? null,
    sort_order: category.sortOrder,
    is_visible: category.visible,
  });

  if (categoryUpsert.error) {
    throw new Error(categoryUpsert.error.message);
  }

  if (section) {
    const sectionUpsert = await supabase.from("pricing_sections").upsert({
      id: section.id,
      category_id: section.categoryId,
      slug: section.slug,
      title: section.title ?? null,
      description: section.description ?? null,
      sort_order: section.sortOrder,
      is_visible: section.visible,
    });

    if (sectionUpsert.error) {
      throw new Error(sectionUpsert.error.message);
    }
  }

  const offeringUpsert = await supabase
    .from("service_offerings")
    .upsert({
      id: offering.id,
      category_id: offering.categoryId,
      pricing_section_id: offering.pricingSectionId ?? null,
      slug: offering.slug,
      name: offering.title,
      description:
        offering.description ??
        (offering.featureBullets.join(" | ") || offering.features.join(" | ") || null),
      notes: offering.subtitle ?? null,
      cta_label: offering.ctaLabel ?? null,
      feature_bullets: offering.featureBullets.length
        ? offering.featureBullets
        : offering.features,
      price_amount: offering.priceAmount,
      currency_code: offering.currencyCode,
      duration_minutes: offering.durationMinutes ?? null,
      is_visible: offering.visible,
      is_bookable: offering.bookable,
      sort_order: offering.sortOrder,
    })
    .select("id")
    .single();

  if (offeringUpsert.error) {
    throw new Error(offeringUpsert.error.message);
  }

  return String(offeringUpsert.data?.id ?? offering.id);
}

export async function getServiceCategories(options?: {
  admin?: boolean;
  archivedOnly?: boolean;
  includeArchived?: boolean;
  includeHidden?: boolean;
}): Promise<PricingCategory[]> {
  if (!hasServerEnv()) {
    return legacyServiceCategories.filter(
      (category) => options?.includeHidden || category.visible,
    );
  }

  const supabase = await getPricingClient(options?.admin);
  let query = supabase
    .from("service_categories")
    .select("id, slug, name, description, sort_order, is_visible, archived_at")
    .order("sort_order", { ascending: true });

  if (options?.archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (!options?.includeHidden) {
    query = query.eq("is_visible", true);
  }

  const { data } = await query;

  if (!data?.length) {
    return legacyServiceCategories.filter(
      (category) => options?.includeHidden || category.visible,
    );
  }

  return data.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? undefined,
    visible: category.is_visible,
    sortOrder: category.sort_order,
    archivedAt: category.archived_at ?? undefined,
  }));
}

export async function getPricingSections(options?: {
  admin?: boolean;
  archivedOnly?: boolean;
  includeArchived?: boolean;
  includeHidden?: boolean;
}): Promise<PricingSection[]> {
  if (!hasServerEnv()) {
    return legacyPricingSections.filter(
      (section) => options?.includeHidden || section.visible,
    );
  }

  const supabase = await getPricingClient(options?.admin);
  let query = supabase
    .from("pricing_sections")
    .select("id, category_id, slug, title, description, sort_order, is_visible, archived_at")
    .order("category_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (options?.archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (!options?.includeHidden) {
    query = query.eq("is_visible", true);
  }

  const { data } = await query;

  if (!data?.length) {
    return legacyPricingSections.filter(
      (section) => options?.includeHidden || section.visible,
    );
  }

  return data.map((section) => ({
    id: section.id,
    categoryId: section.category_id,
    slug: section.slug,
    title: section.title ?? undefined,
    description: section.description ?? undefined,
    visible: section.is_visible,
    sortOrder: section.sort_order,
    archivedAt: section.archived_at ?? undefined,
  }));
}

export async function getServiceOfferings(options?: {
  admin?: boolean;
  archivedOnly?: boolean;
  includeArchived?: boolean;
  includeHidden?: boolean;
}): Promise<ServiceOffering[]> {
  if (!hasServerEnv()) {
    return legacyServiceOfferings.filter(
      (service) => options?.includeHidden || service.visible,
    );
  }

  const supabase = await getPricingClient(options?.admin);
  let query = supabase
    .from("service_offerings")
    .select(
      "id, category_id, pricing_section_id, slug, name, price_amount, currency_code, description, notes, cta_label, feature_bullets, duration_minutes, is_visible, is_bookable, sort_order, archived_at, service_categories!inner(id, slug)",
    )
    .order("category_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (options?.archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (!options?.includeHidden) {
    query = query.eq("is_visible", true);
  }

  const { data } = await query;

  if (!data?.length) {
    return legacyServiceOfferings.filter(
      (service) => options?.includeHidden || service.visible,
    );
  }

  return data.map((service) => {
    const category = unwrapRelation(service.service_categories);
    const priceAmount = Number(service.price_amount);
    const featureBullets = parseFeatures(
      service.feature_bullets,
      service.description,
    );

    return {
      id: String(service.id),
      categoryId: service.category_id,
      categoryKey: category?.slug ?? service.category_id,
      pricingSectionId: service.pricing_section_id ?? undefined,
      title: service.name,
      priceLabel: formatPriceLabel(priceAmount, service.currency_code),
      priceAmount,
      currencyCode: service.currency_code,
      subtitle: service.notes ?? undefined,
      description: service.description ?? undefined,
      ctaLabel: service.cta_label ?? undefined,
      featureBullets,
      durationMinutes: service.duration_minutes ?? undefined,
      slug: service.slug,
      visible: service.is_visible,
      bookable: service.is_bookable,
      sortOrder: service.sort_order,
      archivedAt: service.archived_at ?? undefined,
      features: featureBullets,
    };
  });
}

export async function getPricingCatalog(options?: {
  admin?: boolean;
  archivedOnly?: boolean;
  includeArchived?: boolean;
  includeHidden?: boolean;
}): Promise<PricingCatalogCategory[]> {
  const [categories, sections, services] = await Promise.all([
    getServiceCategories(options),
    getPricingSections(options),
    getServiceOfferings(options),
  ]);

  return buildPricingCatalog(categories, sections, services, {
    includeEmpty: Boolean(options?.admin),
  });
}
