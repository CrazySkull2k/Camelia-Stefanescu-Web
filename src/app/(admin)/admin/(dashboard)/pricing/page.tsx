import { AdminPricingCatalogEditor } from "@/components/admin/admin-pricing-catalog-editor";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import {
  getPricingCatalog,
  getPricingSections,
  getServiceCategories,
  getServiceOfferings,
} from "@/modules/pricing/service";

type PricingAdminPageProps = {
  searchParams: Promise<{
    categorie?: string | string[];
    error?: string | string[];
    status?: string | string[];
  }>;
};

export default async function PricingAdminPage({ searchParams }: PricingAdminPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const [
    query,
    catalog,
    categories,
    sections,
    archivedCategories,
    archivedSections,
    archivedServices,
  ] = await Promise.all([
    searchParams,
    getPricingCatalog({ admin: true, includeHidden: true }),
    getServiceCategories({ admin: true, includeHidden: true }),
    getPricingSections({ admin: true, includeHidden: true }),
    getServiceCategories({ admin: true, archivedOnly: true, includeHidden: true }),
    getPricingSections({ admin: true, archivedOnly: true, includeHidden: true }),
    getServiceOfferings({ admin: true, archivedOnly: true, includeHidden: true }),
  ]);
  const initialCategorySlug = Array.isArray(query.categorie)
    ? query.categorie[0]
    : query.categorie;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <AdminPricingCatalogEditor
      archivedCategories={archivedCategories}
      archivedSections={archivedSections}
      archivedServices={archivedServices}
      catalog={catalog}
      categories={categories}
      feedback={
        error
          ? { tone: "error", value: error }
          : status
            ? { tone: "success", value: "Modificarile de pricing au fost salvate." }
            : null
      }
      initialCategorySlug={initialCategorySlug ?? null}
      sections={sections}
    />
  );
}
