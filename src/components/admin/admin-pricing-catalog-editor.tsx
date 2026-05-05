"use client";

import { useState } from "react";

import type {
  PricingCatalogCategory,
  PricingCategory,
  PricingSection,
  ServiceOffering,
} from "@/modules/pricing/types";

import styles from "./admin-pricing-catalog-editor.module.css";

type AdminPricingCatalogEditorProps = {
  archivedCategories: PricingCategory[];
  archivedSections: PricingSection[];
  archivedServices: ServiceOffering[];
  catalog: PricingCatalogCategory[];
  categories: PricingCategory[];
  feedback?: { tone: "error" | "success"; value: string } | null;
  initialCategorySlug?: string | null;
  sections: PricingSection[];
};

type EditorPanel =
  | { mode: "create"; type: "category" }
  | { category: PricingCategory; mode: "edit"; type: "category" }
  | { categoryId: string; mode: "create"; type: "section" }
  | { mode: "edit"; section: PricingSection; type: "section" }
  | { categoryId: string; mode: "create"; sectionId?: string; type: "service" }
  | { mode: "edit"; service: ServiceOffering; type: "service" };

function resolveCategorySlug(
  catalog: PricingCatalogCategory[],
  requestedCategorySlug?: string | null,
) {
  if (!catalog.length) {
    return "";
  }

  if (requestedCategorySlug) {
    const match = catalog.find((category) => category.slug === requestedCategorySlug);
    if (match) {
      return match.slug;
    }
  }

  return catalog[0]?.slug ?? "";
}

function updateCategoryQuery(categorySlug: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("categorie", categorySlug);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function getCategoryName(categories: PricingCategory[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

function getCategorySlug(categories: PricingCategory[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.slug ?? "";
}

function EntityVisibilityForm({
  categorySlug,
  entity,
  id,
  visible,
}: {
  categorySlug?: string;
  entity: "category" | "section" | "service";
  id: string;
  visible: boolean;
}) {
  return (
    <form action="/api/admin/pricing" method="post">
      <input name="intent" type="hidden" value="toggle-visibility" />
      <input name="entity" type="hidden" value={entity} />
      <input name="id" type="hidden" value={id} />
      <input name="category_slug" type="hidden" value={categorySlug ?? ""} />
      <input name="next_visible" type="hidden" value={visible ? "false" : "true"} />
      <button className={styles.ghostButton} type="submit">
        {visible ? "Dezactiveaza" : "Activeaza"}
      </button>
    </form>
  );
}

function EntityArchiveForm({
  categorySlug,
  entity,
  id,
  label,
}: {
  categorySlug?: string;
  entity: "category" | "section" | "service";
  id: string;
  label: string;
}) {
  return (
    <form
      action="/api/admin/pricing"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(`Scoatem "${label}" din catalog? Il vei putea restaura din Arhivate.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="intent" type="hidden" value="archive" />
      <input name="entity" type="hidden" value={entity} />
      <input name="id" type="hidden" value={id} />
      <input name="category_slug" type="hidden" value={categorySlug ?? ""} />
      <button className={styles.dangerButton} type="submit">
        Scoate
      </button>
    </form>
  );
}

function RestoreForm({
  categorySlug,
  entity,
  id,
}: {
  categorySlug?: string;
  entity: "category" | "section" | "service";
  id: string;
}) {
  return (
    <form action="/api/admin/pricing" method="post">
      <input name="intent" type="hidden" value="restore" />
      <input name="entity" type="hidden" value={entity} />
      <input name="id" type="hidden" value={id} />
      <input name="category_slug" type="hidden" value={categorySlug ?? ""} />
      <button className={styles.ghostButton} type="submit">
        Restaureaza
      </button>
    </form>
  );
}

function CategoryForm({
  panel,
  onClose,
}: {
  onClose: () => void;
  panel: Extract<EditorPanel, { type: "category" }>;
}) {
  const category = panel.mode === "edit" ? panel.category : null;

  return (
    <form action="/api/admin/pricing" className={styles.formGrid} method="post">
      <input name="intent" type="hidden" value="save-category" />
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <label className={styles.field}>
        Nume categorie
        <input className="admin-input" defaultValue={category?.name ?? ""} name="name" required />
      </label>
      <label className={styles.field}>
        Slug
        <input className="admin-input" defaultValue={category?.slug ?? ""} name="slug" />
      </label>
      <label className={styles.field}>
        Descriere
        <textarea
          className="admin-textarea"
          defaultValue={category?.description ?? ""}
          name="description"
          rows={4}
        />
      </label>
      <label className={styles.field}>
        Ordine
        <input
          className="admin-input"
          defaultValue={category?.sortOrder ?? 1}
          min={0}
          name="sort_order"
          type="number"
        />
      </label>
      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input defaultChecked={category?.visible ?? true} name="is_visible" type="checkbox" />
          Vizibila public
        </label>
      </div>
      <div className={styles.drawerFooter}>
        <button className={styles.button} type="submit">
          Salveaza categoria
        </button>
        <button className={styles.ghostButton} type="button" onClick={onClose}>
          Inchide
        </button>
      </div>
    </form>
  );
}

function SectionForm({
  categories,
  panel,
  onClose,
}: {
  categories: PricingCategory[];
  onClose: () => void;
  panel: Extract<EditorPanel, { type: "section" }>;
}) {
  const section = panel.mode === "edit" ? panel.section : null;
  const categoryId = panel.mode === "edit" ? panel.section.categoryId : panel.categoryId;

  return (
    <form action="/api/admin/pricing" className={styles.formGrid} method="post">
      <input name="intent" type="hidden" value="save-section" />
      {section ? <input name="id" type="hidden" value={section.id} /> : null}
      <label className={styles.field}>
        Categorie
        <select className="admin-select" defaultValue={categoryId} name="category_id">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Titlu sectiune
        <input className="admin-input" defaultValue={section?.title ?? ""} name="title" />
      </label>
      <label className={styles.field}>
        Slug
        <input className="admin-input" defaultValue={section?.slug ?? ""} name="slug" />
      </label>
      <label className={styles.field}>
        Descriere
        <textarea
          className="admin-textarea"
          defaultValue={section?.description ?? ""}
          name="description"
          rows={4}
        />
      </label>
      <label className={styles.field}>
        Ordine
        <input
          className="admin-input"
          defaultValue={section?.sortOrder ?? 1}
          min={0}
          name="sort_order"
          type="number"
        />
      </label>
      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input defaultChecked={section?.visible ?? true} name="is_visible" type="checkbox" />
          Vizibila public
        </label>
      </div>
      <div className={styles.drawerFooter}>
        <button className={styles.button} type="submit">
          Salveaza sectiunea
        </button>
        <button className={styles.ghostButton} type="button" onClick={onClose}>
          Inchide
        </button>
      </div>
    </form>
  );
}

function ServiceForm({
  categories,
  panel,
  sections,
  onClose,
}: {
  categories: PricingCategory[];
  onClose: () => void;
  panel: Extract<EditorPanel, { type: "service" }>;
  sections: PricingSection[];
}) {
  const service = panel.mode === "edit" ? panel.service : null;
  const categoryId = panel.mode === "edit" ? panel.service.categoryId : panel.categoryId;
  const sectionId = panel.mode === "edit" ? panel.service.pricingSectionId : panel.sectionId;

  return (
    <form action="/api/admin/pricing" className={styles.formGrid} method="post">
      <input name="intent" type="hidden" value="save-service" />
      {service ? <input name="id" type="hidden" value={service.id} /> : null}
      <label className={styles.field}>
        Nume serviciu
        <input className="admin-input" defaultValue={service?.title ?? ""} name="name" required />
      </label>
      <label className={styles.field}>
        Slug
        <input className="admin-input" defaultValue={service?.slug ?? ""} name="slug" />
      </label>
      <label className={styles.field}>
        Categorie
        <select className="admin-select" defaultValue={categoryId} name="category_id">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Sectiune
        <select className="admin-select" defaultValue={sectionId ?? ""} name="pricing_section_id">
          <option value="">Fara sectiune</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {getCategoryName(categories, section.categoryId)} / {section.title || section.slug}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={styles.field}>
          Pret
          <input
            className="admin-input"
            defaultValue={service?.priceAmount ?? 0}
            min={0}
            name="price_amount"
            step="0.01"
            type="number"
          />
        </label>
        <label className={styles.field}>
          Valuta
          <input
            className="admin-input"
            defaultValue={service?.currencyCode ?? "RON"}
            name="currency_code"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={styles.field}>
          Durata minute
          <input
            className="admin-input"
            defaultValue={service?.durationMinutes ?? ""}
            min={0}
            name="duration_minutes"
            type="number"
          />
        </label>
        <label className={styles.field}>
          Ordine
          <input
            className="admin-input"
            defaultValue={service?.sortOrder ?? 1}
            min={0}
            name="sort_order"
            type="number"
          />
        </label>
      </div>
      <label className={styles.field}>
        Subtitlu / note
        <input className="admin-input" defaultValue={service?.subtitle ?? ""} name="notes" />
      </label>
      <label className={styles.field}>
        CTA label
        <input
          className="admin-input"
          defaultValue={service?.ctaLabel ?? "Programeaza"}
          name="cta_label"
        />
      </label>
      <label className={styles.field}>
        Bullet-uri
        <span className={styles.fieldHint}>Cate un bullet pe linie.</span>
        <textarea
          className="admin-textarea"
          defaultValue={(service?.featureBullets ?? []).join("\n")}
          name="feature_bullets"
          rows={7}
        />
      </label>
      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input defaultChecked={service?.visible ?? true} name="is_visible" type="checkbox" />
          Vizibil public
        </label>
        <label className={styles.checkboxLabel}>
          <input defaultChecked={service?.bookable ?? true} name="is_bookable" type="checkbox" />
          Poate fi rezervat
        </label>
      </div>
      <div className={styles.drawerFooter}>
        <button className={styles.button} type="submit">
          Salveaza serviciul
        </button>
        <button className={styles.ghostButton} type="button" onClick={onClose}>
          Inchide
        </button>
      </div>
    </form>
  );
}

function EditorDrawer({
  categories,
  panel,
  sections,
  onClose,
}: {
  categories: PricingCategory[];
  onClose: () => void;
  panel: EditorPanel | null;
  sections: PricingSection[];
}) {
  if (!panel) {
    return null;
  }

  const title =
    panel.type === "category"
      ? panel.mode === "create"
        ? "Categorie noua"
        : "Editeaza categoria"
      : panel.type === "section"
        ? panel.mode === "create"
          ? "Sectiune noua"
          : "Editeaza sectiunea"
        : panel.mode === "create"
          ? "Item nou"
          : "Editeaza item";

  return (
    <div className={styles.overlay} role="presentation">
      <aside className={styles.drawer} aria-label={title}>
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.eyebrow}>Editor preturi</p>
            <h2 className={styles.drawerTitle}>{title}</h2>
          </div>
          <button className={styles.ghostButton} type="button" onClick={onClose}>
            Inchide
          </button>
        </div>

        {panel.type === "category" ? (
          <CategoryForm panel={panel} onClose={onClose} />
        ) : panel.type === "section" ? (
          <SectionForm categories={categories} panel={panel} onClose={onClose} />
        ) : (
          <ServiceForm
            categories={categories}
            panel={panel}
            sections={sections}
            onClose={onClose}
          />
        )}
      </aside>
    </div>
  );
}

export function AdminPricingCatalogEditor({
  archivedCategories,
  archivedSections,
  archivedServices,
  catalog,
  categories,
  feedback,
  initialCategorySlug,
  sections,
}: AdminPricingCatalogEditorProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState(() =>
    resolveCategorySlug(catalog, initialCategorySlug),
  );
  const [panel, setPanel] = useState<EditorPanel | null>(null);
  const activeCategory =
    catalog.find((category) => category.slug === activeCategorySlug) ?? catalog[0] ?? null;
  const archivedCount =
    archivedCategories.length + archivedSections.length + archivedServices.length;

  function handleCategoryChange(categorySlug: string) {
    setActiveCategorySlug(categorySlug);
    updateCategoryQuery(categorySlug);
  }

  return (
    <div className={styles.shell}>
      {feedback ? (
        <div
          className={`rounded-[1.5rem] border px-5 py-4 text-sm font-semibold ${
            feedback.tone === "error"
              ? "border-[#fe8983]/40 bg-[#fff7f6] text-[#752121]"
              : "border-[#ffdcbd]/55 bg-[#fff7f3] text-[#654d35]"
          }`}
        >
          {feedback.value}
        </div>
      ) : null}

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Administrare preturi</p>
        <h1 className={styles.heroTitle}>Catalog preturi</h1>
        <p className={styles.heroCopy}>
          Editeaza categoriile, sectiunile si cardurile exact in limbajul vizual al paginii
          publice. Itemele inactive raman aici pentru lucru intern, dar dispar din pagina publica.
        </p>
        <div className={styles.heroActions}>
          <button
            className={styles.button}
            type="button"
            onClick={() => setPanel({ mode: "create", type: "category" })}
          >
            Adauga categorie
          </button>
          <a className={styles.ghostButton} href="/preturi" rel="noreferrer" target="_blank">
            Vezi pagina publica
          </a>
        </div>
      </section>

      {catalog.length ? (
        <div className={styles.stickyBar}>
          <div className={styles.tabRail} role="tablist" aria-label="Categorii de preturi">
            {catalog.map((category) => {
              const active = category.slug === activeCategory?.slug;

              return (
                <button
                  aria-selected={active}
                  className={`${styles.tabButton}${active ? ` ${styles.tabButtonActive}` : ""}`}
                  id={`admin-pricing-tab-${category.slug}`}
                  key={category.id}
                  role="tab"
                  type="button"
                  onClick={() => handleCategoryChange(category.slug)}
                >
                  {category.name}
                  {!category.visible ? <span className={styles.warningChip}>Inactiv</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeCategory ? (
        <section
          aria-labelledby={`admin-pricing-tab-${activeCategory.slug}`}
          className={styles.panel}
          role="tabpanel"
        >
          <div className={styles.categoryHeader}>
            <div>
              <p className={styles.eyebrow}>{activeCategory.slug}</p>
              <h2 className={styles.categoryTitle}>{activeCategory.name}</h2>
              {activeCategory.description ? (
                <p className={styles.categoryDescription}>{activeCategory.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={activeCategory.visible ? styles.statusChip : styles.warningChip}>
                  {activeCategory.visible ? "Activa" : "Inactiva"}
                </span>
                <span className={styles.softChip}>Ordine {activeCategory.sortOrder}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  setPanel({ category: activeCategory, mode: "edit", type: "category" })
                }
              >
                Editeaza
              </button>
              <EntityVisibilityForm
                entity="category"
                id={activeCategory.id}
                visible={activeCategory.visible}
              />
              <div className={styles.inlineHelp}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() =>
                    setPanel({
                      categoryId: activeCategory.id,
                      mode: "create",
                      type: "section",
                    })
                  }
                >
                  Adauga sectiune
                </button>
                <span
                  aria-label="O sectiune este un grup de servicii din categoria curenta, de exemplu Consultatii, Pachete sau Proceduri."
                  className={styles.infoButton}
                  tabIndex={0}
                >
                  ?
                </span>
                <span className={styles.infoTooltip} role="tooltip">
                  O sectiune este un grup de servicii din categoria curenta, de exemplu
                  Consultatii, Pachete sau Proceduri.
                </span>
              </div>
              <EntityArchiveForm
                entity="category"
                id={activeCategory.id}
                label={activeCategory.name}
              />
            </div>
          </div>

          {activeCategory.sections.length ? (
            activeCategory.sections.map((section) => (
              <section className={styles.sectionBlock} key={section.id}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>{section.slug}</p>
                    {section.title ? (
                      <h3 className={styles.sectionTitle}>{section.title}</h3>
                    ) : null}
                    {section.description ? (
                      <p className={styles.sectionDescription}>{section.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={section.visible ? styles.statusChip : styles.warningChip}>
                        {section.visible ? "Activa" : "Inactiva"}
                      </span>
                      <span className={styles.softChip}>Ordine {section.sortOrder}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.ghostButton}
                      type="button"
                      onClick={() =>
                        setPanel({ mode: "edit", section, type: "section" })
                      }
                    >
                      Editeaza
                    </button>
                    <EntityVisibilityForm
                      categorySlug={activeCategory.slug}
                      entity="section"
                      id={section.id}
                      visible={section.visible}
                    />
                    <button
                      className={styles.button}
                      type="button"
                      onClick={() =>
                        setPanel({
                          categoryId: activeCategory.id,
                          mode: "create",
                          sectionId: section.id,
                          type: "service",
                        })
                      }
                    >
                      Adauga item
                    </button>
                    <EntityArchiveForm
                      categorySlug={activeCategory.slug}
                      entity="section"
                      id={section.id}
                      label={section.title || section.slug}
                    />
                  </div>
                </div>

                {section.items.length ? (
                  <div className={styles.grid}>
                    {section.items.map((item) => (
                      <article
                        className={`${styles.card}${!item.visible ? ` ${styles.cardInactive}` : ""}`}
                        key={item.id}
                      >
                        <div className={styles.cardTop}>
                          <div className="flex flex-wrap gap-2">
                            <span className={item.visible ? styles.statusChip : styles.warningChip}>
                              {item.visible ? "Activ" : "Inactiv"}
                            </span>
                            {!item.bookable ? (
                              <span className={styles.softChip}>Nerezervabil</span>
                            ) : null}
                          </div>
                          <h3 className={styles.cardTitle}>{item.title}</h3>
                          <div className={styles.priceRow}>
                            <span className={styles.price}>{item.priceLabel}</span>
                            {item.subtitle ? (
                              <span className={styles.subtitle}>{item.subtitle}</span>
                            ) : null}
                          </div>
                        </div>

                        <ul className={styles.features}>
                          {item.featureBullets.map((feature) => (
                            <li className={styles.featureItem} key={feature}>
                              <span className={styles.featureIcon} aria-hidden="true">
                                &bull;
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className={styles.cardActions}>
                          <button
                            className={styles.ghostButton}
                            type="button"
                            onClick={() =>
                              setPanel({ mode: "edit", service: item, type: "service" })
                            }
                          >
                            Editeaza
                          </button>
                          <EntityVisibilityForm
                            categorySlug={activeCategory.slug}
                            entity="service"
                            id={item.id}
                            visible={item.visible}
                          />
                          <EntityArchiveForm
                            categorySlug={activeCategory.slug}
                            entity="service"
                            id={item.id}
                            label={item.title}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    Sectiunea nu are inca iteme. Adauga primul card de pret.
                  </div>
                )}
              </section>
            ))
          ) : (
            <div className={styles.emptyState}>
              Categoria nu are inca sectiuni. Adauga o sectiune pentru a incepe catalogul.
            </div>
          )}
        </section>
      ) : (
        <div className={styles.emptyState}>
          Nu exista categorii de preturi. Adauga prima categorie pentru a construi catalogul.
        </div>
      )}

      <details className={styles.archiveBox}>
        <summary className={styles.archiveSummary}>Arhivate ({archivedCount})</summary>
        <div className={styles.archiveGrid}>
          {archivedCount ? (
            <>
              {archivedCategories.map((category) => (
                <div className={styles.archiveItem} key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <p className="text-sm text-[#5e6058]">Categorie / {category.slug}</p>
                  </div>
                  <RestoreForm entity="category" id={category.id} />
                </div>
              ))}
              {archivedSections.map((section) => (
                <div className={styles.archiveItem} key={section.id}>
                  <div>
                    <strong>{section.title || section.slug}</strong>
                    <p className="text-sm text-[#5e6058]">
                      Sectiune / {getCategoryName([...categories, ...archivedCategories], section.categoryId)}
                    </p>
                  </div>
                  <RestoreForm
                    categorySlug={getCategorySlug([...categories, ...archivedCategories], section.categoryId)}
                    entity="section"
                    id={section.id}
                  />
                </div>
              ))}
              {archivedServices.map((service) => (
                <div className={styles.archiveItem} key={service.id}>
                  <div>
                    <strong>{service.title}</strong>
                    <p className="text-sm text-[#5e6058]">
                      Item / {getCategoryName([...categories, ...archivedCategories], service.categoryId)}
                    </p>
                  </div>
                  <RestoreForm
                    categorySlug={getCategorySlug([...categories, ...archivedCategories], service.categoryId)}
                    entity="service"
                    id={service.id}
                  />
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-[#5e6058]">Nu exista elemente arhivate.</p>
          )}
        </div>
      </details>

      <EditorDrawer
        categories={categories}
        onClose={() => setPanel(null)}
        panel={panel}
        sections={sections}
      />
    </div>
  );
}
