import { connection } from "next/server";

import { CellularDiagnosisExactDesignPage } from "@/components/site/exact-design-pages/cellular-diagnosis-exact-design-page";

export default async function CellularDiagnosisPage() {
  await connection();

  return <CellularDiagnosisExactDesignPage />;
}
