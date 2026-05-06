import { connection } from "next/server";

import { HomeExactDesignPage } from "@/components/site/exact-design-pages/home-exact-design-page";

export default async function HomePage() {
  await connection();

  return <HomeExactDesignPage />;
}
