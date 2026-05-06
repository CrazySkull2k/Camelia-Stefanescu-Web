import { connection } from "next/server";

import { NutritionServicesExactDesignPage } from "@/components/site/exact-design-pages/nutrition-services-exact-design-page";

export default async function NutritionServicesCanonicalPage() {
  await connection();

  return <NutritionServicesExactDesignPage />;
}
