import { PricingPage } from "@/components/site/pricing-page";
import { getPricingCatalog } from "@/modules/pricing/service";

type PricingRouteProps = {
  searchParams: Promise<{
    categorie?: string | string[];
  }>;
};

export default async function PricingRoute(props: PricingRouteProps) {
  const [categories, searchParams] = await Promise.all([
    getPricingCatalog(),
    props.searchParams,
  ]);
  const requestedCategory = Array.isArray(searchParams.categorie)
    ? searchParams.categorie[0]
    : searchParams.categorie;

  return (
    <PricingPage
      categories={categories}
      initialCategorySlug={requestedCategory ?? null}
    />
  );
}
