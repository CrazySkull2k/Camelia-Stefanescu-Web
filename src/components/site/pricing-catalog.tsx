"use client";

import Link from "next/link";
import { useState } from "react";

import type { PricingCatalogCategory } from "@/modules/pricing/types";

import styles from "./pricing-page.module.css";

type PricingCatalogProps = {
  categories: PricingCatalogCategory[];
  initialCategorySlug?: string | null;
};

function resolveCategorySlug(
  categories: PricingCatalogCategory[],
  requestedCategorySlug?: string | null,
) {
  if (!categories.length) {
    return "";
  }

  if (requestedCategorySlug) {
    const match = categories.find((category) => category.slug === requestedCategorySlug);
    if (match) {
      return match.slug;
    }
  }

  return categories[0]?.slug ?? "";
}

export function PricingCatalog({
  categories,
  initialCategorySlug,
}: PricingCatalogProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState(() =>
    resolveCategorySlug(categories, initialCategorySlug),
  );

  const activeCategory =
    categories.find((category) => category.slug === activeCategorySlug) ?? categories[0] ?? null;

  function handleCategoryChange(categorySlug: string) {
    setActiveCategorySlug(categorySlug);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("categorie", categorySlug);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (!activeCategory) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.stickyBar}>
        <div className={styles.tabRail} role="tablist" aria-label="Categorii de preturi">
          {categories.map((category) => {
            const active = category.slug === activeCategory.slug;
            const itemCount = category.sections.reduce(
              (total, section) => total + section.items.length,
              0,
            );

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`pricing-panel-${category.slug}`}
                id={`pricing-tab-${category.slug}`}
                className={`${styles.tabButton}${active ? ` ${styles.tabButtonActive}` : ""}`}
                onClick={() => handleCategoryChange(category.slug)}
              >
                <span className={styles.tabLabel}>{category.name}</span>
                <span className={styles.tabMeta}>{itemCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`pricing-panel-${activeCategory.slug}`}
        role="tabpanel"
        aria-labelledby={`pricing-tab-${activeCategory.slug}`}
        className={styles.panel}
      >
        <div className={styles.heading}>
          <p className={styles.headingEyebrow}>Catalog public</p>
          <h2 className={styles.title}>{activeCategory.name}</h2>
          {activeCategory.description ? (
            <p className={styles.description}>{activeCategory.description}</p>
          ) : null}
        </div>

        <div className={styles.sections}>
          {activeCategory.sections.map((section, index) => (
            <section key={section.id} className={styles.sectionBlock}>
              {section.title || section.description ? (
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionHeaderRow}>
                    <span className={styles.sectionIndex}>
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div>
                      {section.title ? <h3 className={styles.sectionTitle}>{section.title}</h3> : null}
                      {section.description ? (
                        <p className={styles.sectionDescription}>{section.description}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={styles.grid}>
                {section.items.map((item) => (
                  <article key={item.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.priceWrap}>
                        <div className={styles.cardMetaRow}>
                          {item.durationMinutes ? (
                            <span className={styles.metaChip}>{item.durationMinutes} min</span>
                          ) : null}
                          {item.subtitle ? (
                            <span className={styles.metaChip}>{item.subtitle}</span>
                          ) : null}
                        </div>

                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>{item.priceLabel}</span>
                        </div>
                        {item.description ? (
                          <p className={styles.itemDescription}>{item.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <ul className={styles.features}>
                      {item.featureBullets.map((feature) => (
                        <li key={feature} className={styles.featureItem}>
                          <span className={styles.featureIcon} aria-hidden="true">
                            •
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.cardActions}>
                      <Link
                        className={styles.primaryAction}
                        href={`/programare?service=${encodeURIComponent(item.slug)}`}
                      >
                        {item.ctaLabel ?? "Programeaza"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
