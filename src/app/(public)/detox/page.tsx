import { connection } from "next/server";

import { DetoxExactDesignPage } from "@/components/site/exact-design-pages/detox-exact-design-page";

export default async function DetoxPage() {
  await connection();

  return <DetoxExactDesignPage />;
}
