import "server-only";

import { sanitizeRichHtml } from "@/lib/validation/html";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import {
  CMS_IMAGE_OVERRIDES_SECTION,
  CMS_TEXT_OVERRIDES_SECTION,
  cloneCmsContent,
  cmsAccentPresets,
  type CmsCardFieldDefinition,
  type CmsFieldDefinition,
  type CmsImageValue,
  type CmsPageContent,
  type CmsPageDefinition,
  type CmsSectionContent,
} from "@/modules/cms/registry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback = "") {
  return sanitizePlainText(String(value ?? fallback)).trim();
}

function getRawString(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function limitText(value: string, maxLength = 900) {
  return value.slice(0, maxLength);
}

function isAllowedAccent(value: unknown) {
  return cmsAccentPresets.includes(value as never);
}

function isAllowedImagePath(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("site-media/") ||
    value.startsWith("blog-covers/")
  );
}

function validateImage(value: unknown, fallback: unknown): CmsImageValue {
  const source = isRecord(value) ? value : {};
  const fallbackSource = isRecord(fallback) ? fallback : {};
  const src = getString(source.src, getString(fallbackSource.src));
  const alt = limitText(getString(source.alt, getString(fallbackSource.alt)), 180);

  return {
    alt,
    src: isAllowedImagePath(src) ? src : getString(fallbackSource.src),
  };
}

function getArray(value: unknown, fallback: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return Array.isArray(fallback) ? fallback : [];
}

function validateList(value: unknown, fallback: unknown, maxItems = 12) {
  return getArray(value, fallback)
    .slice(0, maxItems)
    .map((item) => limitText(getString(item), 900))
    .filter(Boolean);
}

function validateStats(value: unknown, fallback: unknown, maxItems = 6) {
  return getArray(value, fallback)
    .slice(0, maxItems)
    .map((item, index) => {
      const record = isRecord(item) ? item : {};
      const fallbackRecord = isRecord((fallback as unknown[] | undefined)?.[index])
        ? ((fallback as unknown[])[index] as Record<string, unknown>)
        : {};

      return {
        label: limitText(getString(record.label, getString(fallbackRecord.label)), 120),
        value: limitText(getString(record.value, getString(fallbackRecord.value)), 40),
      };
    })
    .filter((item) => item.label || item.value);
}

function validateFaq(value: unknown, fallback: unknown, maxItems = 10) {
  return getArray(value, fallback)
    .slice(0, maxItems)
    .map((item, index) => {
      const record = isRecord(item) ? item : {};
      const fallbackRecord = isRecord((fallback as unknown[] | undefined)?.[index])
        ? ((fallback as unknown[])[index] as Record<string, unknown>)
        : {};

      return {
        answer: limitText(getString(record.answer, getString(fallbackRecord.answer)), 1200),
        question: limitText(getString(record.question, getString(fallbackRecord.question)), 220),
      };
    })
    .filter((item) => item.question || item.answer);
}

function validateScalarField(
  field: CmsFieldDefinition | CmsCardFieldDefinition,
  value: unknown,
  fallback: unknown,
) {
  if (field.type === "image") {
    return validateImage(value, fallback);
  }

  if (field.type === "list") {
    return validateList(value, fallback, field.maxItems);
  }

  if (field.type === "accentPreset") {
    return isAllowedAccent(value)
      ? value
      : isAllowedAccent(fallback)
        ? fallback
        : "default";
  }

  if (field.type === "richText") {
    return sanitizeRichHtml(getRawString(value, getRawString(fallback)));
  }

  if (field.type === "text" || field.type === "textarea") {
    return limitText(getString(value, getString(fallback)), field.maxLength);
  }

  return limitText(getString(value, getString(fallback)));
}

function validateCards(field: Extract<CmsFieldDefinition, { type: "cards" }>, value: unknown, fallback: unknown) {
  const sourceItems = getArray(value, fallback).slice(0, field.maxItems ?? 8);
  const fallbackItems = Array.isArray(fallback) ? fallback : [];

  return sourceItems
    .map((item, index) => {
      const record = isRecord(item) ? item : {};
      const fallbackRecord = isRecord(fallbackItems[index])
        ? (fallbackItems[index] as Record<string, unknown>)
        : {};

      return Object.fromEntries(
        field.cardFields.map((cardField) => [
          cardField.name,
          validateScalarField(
            cardField,
            record[cardField.name],
            fallbackRecord[cardField.name],
          ),
        ]),
      );
    })
    .filter((item) =>
      Object.values(item).some((value) =>
        Array.isArray(value)
          ? value.length > 0
          : isRecord(value)
            ? Object.values(value).some(Boolean)
            : Boolean(value),
      ),
    );
}

function validateField(field: CmsFieldDefinition, value: unknown, fallback: unknown) {
  if (field.type === "stats") {
    return validateStats(value, fallback, field.maxItems);
  }

  if (field.type === "faq") {
    return validateFaq(value, fallback, field.maxItems);
  }

  if (field.type === "cards") {
    return validateCards(field, value, fallback);
  }

  return validateScalarField(field, value, fallback);
}

function validateTextOverrides(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  const overrides: Record<string, { label: string; text: string }> = {};

  for (const [key, override] of Object.entries(value).slice(0, 500)) {
    const source = isRecord(override) ? override : {};
    const overrideKey = limitText(getString(key), 240);
    const text = limitText(getString(source.text), 2000);

    if (overrideKey && text) {
      overrides[overrideKey] = {
        label: limitText(getString(source.label), 180),
        text,
      };
    }
  }

  return overrides;
}

function validateImageOverrides(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  const overrides: Record<string, { alt: string; label: string; src: string }> = {};

  for (const [key, override] of Object.entries(value).slice(0, 250)) {
    const image = validateImage(override, {});
    const overrideKey = limitText(getString(key), 240);

    if (overrideKey && image.src) {
      overrides[overrideKey] = {
        ...image,
        label: limitText(getString(isRecord(override) ? override.label : ""), 180),
      };
    }
  }

  return overrides;
}

export function validateCmsContent(
  definition: CmsPageDefinition,
  rawContent: unknown,
): CmsPageContent {
  const raw = isRecord(rawContent) ? rawContent : {};
  const defaults = cloneCmsContent(definition.defaultContent);

  const content = Object.fromEntries(
    definition.sections.map((section) => {
      const rawSection: Record<string, unknown> = isRecord(raw[section.key])
        ? (raw[section.key] as Record<string, unknown>)
        : {};
      const fallbackSection: Record<string, unknown> = isRecord(defaults[section.key])
        ? (defaults[section.key] as Record<string, unknown>)
        : {};
      const sectionContent: CmsSectionContent = {};

      for (const field of section.fields) {
        sectionContent[field.name] = validateField(
          field,
          rawSection[field.name],
          fallbackSection[field.name],
        );
      }

      return [section.key, sectionContent];
    }),
  );

  const textOverrides = validateTextOverrides(raw[CMS_TEXT_OVERRIDES_SECTION]);
  const imageOverrides = validateImageOverrides(raw[CMS_IMAGE_OVERRIDES_SECTION]);

  if (Object.keys(textOverrides).length) {
    content[CMS_TEXT_OVERRIDES_SECTION] = textOverrides;
  }

  if (Object.keys(imageOverrides).length) {
    content[CMS_IMAGE_OVERRIDES_SECTION] = imageOverrides;
  }

  return content;
}
