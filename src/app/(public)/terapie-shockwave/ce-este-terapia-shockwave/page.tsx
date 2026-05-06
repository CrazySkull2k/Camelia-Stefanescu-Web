import { connection } from "next/server";

import { ShockwaveWhatIsExactDesignPage } from "@/components/site/exact-design-pages/shockwave-what-is-exact-design-page";

export default async function ShockwaveWhatIsPage() {
  await connection();

  return <ShockwaveWhatIsExactDesignPage />;
}
