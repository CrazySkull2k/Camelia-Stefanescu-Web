import type { CmsImageValue, CmsPageContent, CmsSectionContent } from "@/modules/cms/registry";

export function getCmsSection(content: CmsPageContent, sectionKey: string): CmsSectionContent {
  const section = content[sectionKey];
  return typeof section === "object" && section !== null && !Array.isArray(section)
    ? section
    : {};
}

export function getCmsText(section: CmsSectionContent, key: string, fallback = "") {
  const value = section[key];
  return typeof value === "string" ? value : fallback;
}

export function getCmsList(section: CmsSectionContent, key: string) {
  const value = section[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function getCmsCards<T extends Record<string, unknown>>(
  section: CmsSectionContent,
  key: string,
) {
  const value = section[key];
  return Array.isArray(value)
    ? value.filter((item): item is T => typeof item === "object" && item !== null && !Array.isArray(item))
    : [];
}

export function getCmsImage(section: CmsSectionContent, key: string): CmsImageValue {
  const value = section[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { alt: "", src: "" };
  }

  const image = value as Partial<CmsImageValue>;
  return {
    alt: typeof image.alt === "string" ? image.alt : "",
    src: typeof image.src === "string" ? image.src : "",
  };
}
