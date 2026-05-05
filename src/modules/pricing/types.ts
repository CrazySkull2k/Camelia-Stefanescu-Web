export type PricingCategoryKey = string;

export type PricingCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  visible: boolean;
  sortOrder: number;
  archivedAt?: string;
};

export type PricingSection = {
  id: string;
  categoryId: string;
  slug: string;
  title?: string;
  description?: string;
  visible: boolean;
  sortOrder: number;
  archivedAt?: string;
};

export type ServiceOffering = {
  id: string;
  categoryId: string;
  categoryKey: PricingCategoryKey;
  pricingSectionId?: string;
  title: string;
  priceLabel: string;
  priceAmount: number;
  currencyCode: string;
  subtitle?: string;
  description?: string;
  ctaLabel?: string;
  featureBullets: string[];
  features: string[];
  durationMinutes?: number;
  slug: string;
  visible: boolean;
  bookable: boolean;
  sortOrder: number;
  archivedAt?: string;
};

export type PricingCatalogSection = PricingSection & {
  items: ServiceOffering[];
};

export type PricingCatalogCategory = PricingCategory & {
  sections: PricingCatalogSection[];
};
