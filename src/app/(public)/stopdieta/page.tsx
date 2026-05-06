import { connection } from "next/server";

import { StopDietaExactDesignPage } from "@/components/site/exact-design-pages/stop-dieta-exact-design-page";

export default async function StopDietaPage() {
  await connection();

  return <StopDietaExactDesignPage />;
}
