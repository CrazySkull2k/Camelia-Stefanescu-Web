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
  introBody,
  introTitle,
  initialCategorySlug,
}: PricingPageProps) {
  const sectionCount = categories.reduce((total, category) => total + category.sections.length, 0);
  const serviceCount = categories.reduce(
    (total, category) =>
      total +
      category.sections.reduce((sectionTotal, section) => sectionTotal + section.items.length, 0),
    0,
  );

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

            <div className={styles.metricRow} aria-label="Rezumat catalog preturi">
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{categories.length}</span>
                <span className={styles.metricLabel}>Categorii</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{sectionCount}</span>
                <span className={styles.metricLabel}>Sectiuni</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{serviceCount}</span>
                <span className={styles.metricLabel}>Servicii</span>
              </div>
            </div>
          </div>

          {introTitle || introBody ? (
            <aside className={styles.introCard}>
              {introTitle ? <h2 className={styles.introTitle}>{introTitle}</h2> : null}
              {introBody ? <p className={styles.introBody}>{introBody}</p> : null}
            </aside>
          ) : (
            <aside className={styles.introCard}>
              <p className={styles.introKicker}>Categorii active</p>
              <div className={styles.introPills}>
                {categories.map((category) => (
                  <span key={category.id} className={styles.introPill}>
                    {category.name}
                  </span>
                ))}
              </div>
            </aside>
          )}
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
