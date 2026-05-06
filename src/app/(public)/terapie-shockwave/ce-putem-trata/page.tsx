import { connection } from "next/server";

import { ShockwaveTreatmentsExactDesignPage } from "@/components/site/exact-design-pages/shockwave-treatments-exact-design-page";

export default async function ShockwaveTreatmentsPage() {
  await connection();

  return <ShockwaveTreatmentsExactDesignPage />;
}
