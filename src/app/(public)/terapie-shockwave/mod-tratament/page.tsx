import { connection } from "next/server";

import { ShockwaveTreatmentModeExactDesignPage } from "@/components/site/exact-design-pages/shockwave-treatment-mode-exact-design-page";

export default async function ShockwaveTreatmentModePage() {
  await connection();

  return <ShockwaveTreatmentModeExactDesignPage />;
}
