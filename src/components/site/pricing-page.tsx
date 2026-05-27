import { PricingCatalog } from "@/components/site/pricing-catalog";
import type { PricingCatalogCategory } from "@/modules/pricing/types";

import styles from "./pricing-page.module.css";

type PricingPageProps = {
  categories: PricingCatalogCategory[];
  heroDescription?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  introBody?: string;
  introTitle?: string;
  initialCategorySlug?: string | null;
};

export function PricingPage({
  categories,
  heroDescription,
  heroEyebrow,
  heroTitle = "Preturi",
  initialCategorySlug,
}: PricingPageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.breadcrumb}>Acasa / Preturi</p>
            {heroEyebrow ? <p className={styles.heroEyebrow}>{heroEyebrow}</p> : null}
            <h1 className={styles.heroTitle}>{heroTitle}</h1>
            {heroDescription ? (
              <p className={styles.heroDescription}>{heroDescription}</p>
            ) : null}
          </div>
        </header>

        <PricingCatalog
          key={initialCategorySlug ?? categories[0]?.slug ?? "pricing"}
          categories={categories}
          initialCategorySlug={initialCategorySlug}
        />
      </div>
    </main>
  );
}
