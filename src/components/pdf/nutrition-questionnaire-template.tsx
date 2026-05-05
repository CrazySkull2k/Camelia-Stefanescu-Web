import type {
  NutritionQuestionnairePdfBlock,
  NutritionQuestionnairePdfChecklistCard,
  NutritionQuestionnairePdfInfoCard,
  NutritionQuestionnairePdfModel,
  NutritionQuestionnairePdfSection,
  NutritionQuestionnairePdfStatusCard,
  NutritionQuestionnairePdfTable,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";

type NutritionQuestionnaireTemplateProps = {
  fontFacesCss: string;
  model: NutritionQuestionnairePdfModel;
};

function SpaIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-spa" viewBox="0 0 24 24">
      <path
        d="M12 5c-2.7 1.8-4 4.1-4 6.7 0 2.2 1.8 4.2 4 4.2s4-2 4-4.2C16 9.1 14.7 6.8 12 5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M8.3 7.3C5.9 7.6 4 9.7 4 12.1c0 2 1.4 3.8 3.3 4.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M15.7 7.3c2.4.3 4.3 2.4 4.3 4.8 0 2-1.4 3.8-3.3 4.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-check-circle" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="none" r="8.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m8.7 12.1 2.1 2.1 4.5-4.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-card" viewBox="0 0 24 24">
      <path
        d="M6 9.2h8.4c0 3.5-1.4 6.3-4.2 6.3S6 12.7 6 9.2Zm8.4 1.1h1.7c1 0 1.9.8 1.9 1.8s-.9 1.8-1.9 1.8H15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M7.5 18h6.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function CookieIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-card" viewBox="0 0 24 24">
      <path
        d="M12.4 5.5a6.7 6.7 0 1 0 6.1 9.6 4.2 4.2 0 0 1-5.9-4.8 4.1 4.1 0 0 1-4.6-4.8 6.7 6.7 0 0 0 4.4 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="10.2" cy="10.2" fill="currentColor" r="0.8" />
      <circle cx="14.9" cy="13.4" fill="currentColor" r="0.8" />
      <circle cx="10.8" cy="15.8" fill="currentColor" r="0.8" />
    </svg>
  );
}

function KitchenIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-card" viewBox="0 0 24 24">
      <path
        d="M8.2 6.3v4.5m0 0c0 2.7-1 5-2.7 6.9m2.7-6.9H5.8m2.4 0h2.4M16 6.3v7.5m0 0-1.9 4m1.9-4 1.9 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SmokingIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M5 14.5h8.8m0 0h2.3a1.9 1.9 0 0 0 0-3.8h-1.1m-1.2 3.8V9.4m4.6 5.1h1.6m-15 0h1.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M15.4 8c0-.9.7-1.6 1.6-1.6m.7-1.6c0-1 .8-1.8 1.8-1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function AlcoholIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M8 5.5h8l-.8 4.2a3.2 3.2 0 0 1-3.1 2.6h-.2a3.2 3.2 0 0 1-3.1-2.6L8 5.5Zm4 6.8V18m-2.4 0h4.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MedicalIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M10 6.2h4m-2-2v4m-4.8 8.5h9.6a1.7 1.7 0 0 0 1.7-1.7V9.2a1.7 1.7 0 0 0-1.7-1.7H7.2a1.7 1.7 0 0 0-1.7 1.7V15a1.7 1.7 0 0 0 1.7 1.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SupplementIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M9.2 8.3a3.1 3.1 0 1 1 4.4 4.4l-2.9 2.9a3.1 3.1 0 1 1-4.4-4.4l2.9-2.9Zm3 3 5.4 5.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M8.5 6.7a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm2 12.6 1.3-4.4 2.2 1.7v2.7m-4.9-.7L7.5 14l2.6-2.4 1.2-2.8 2.6 1.6 2.9.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function AppetiteIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M7 6v5.8M10.2 6v5.8M7 9h3.2m2.8-3v13m4.2-13v5.8M17 6v5.8m-2.8 0h5.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CycleIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M17.5 12a5.5 5.5 0 1 1-5.5-5.5 4.7 4.7 0 0 0 0 9.4A5.5 5.5 0 0 1 17.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CareIcon() {
  return (
    <svg aria-hidden="true" className="icon icon-status" viewBox="0 0 24 24">
      <path
        d="M12 18.5s-5.6-3.4-5.6-8.3A3.4 3.4 0 0 1 12 7.5a3.4 3.4 0 0 1 5.6 2.7c0 4.9-5.6 8.3-5.6 8.3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function SectionHeading({
  title,
  contextLabel,
}: {
  title: string;
  contextLabel?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <div className="section-heading-side">
        {contextLabel ? <p className="section-heading-context">{contextLabel}</p> : null}
        <div className="section-heading-line" />
      </div>
    </div>
  );
}

function ChecklistCard({ card }: { card: NutritionQuestionnairePdfChecklistCard }) {
  return (
    <div className="checklist-card">
      <h3>{card.title}</h3>
      <ul className="checklist">
        {card.items.map((item) => (
          <li key={`${card.title}-${item}`}>
            <CheckCircleIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoCard({
  card,
}: {
  card: NutritionQuestionnairePdfInfoCard;
}) {
  const icon =
    card.tone === "tertiary" ? <CoffeeIcon /> : card.tone === "secondary" ? <CookieIcon /> : <KitchenIcon />;

  return (
    <div className={`info-card info-card-${card.tone}`}>
      <div className="info-card-heading">
        {icon}
        <span>{card.title}</span>
      </div>
      {card.items.length ? (
        <ul className="info-card-list">
          {card.items.map((item) => (
            <li key={`${card.title}-${item}`}>
              <CheckCircleIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : card.value ? (
        <p>{card.value}</p>
      ) : null}
      {card.note ? <p className="info-card-note">{card.note}</p> : null}
    </div>
  );
}

function StatusIcon({ icon }: { icon: NutritionQuestionnairePdfStatusCard["icon"] }) {
  switch (icon) {
    case "smoking":
      return <SmokingIcon />;
    case "alcohol":
      return <AlcoholIcon />;
    case "medical":
      return <MedicalIcon />;
    case "supplement":
      return <SupplementIcon />;
    case "activity":
      return <ActivityIcon />;
    case "appetite":
      return <AppetiteIcon />;
    case "cycle":
      return <CycleIcon />;
    case "care":
      return <CareIcon />;
    default:
      return <MedicalIcon />;
  }
}

function StatusCard({ card }: { card: NutritionQuestionnairePdfStatusCard }) {
  return (
    <article className={`status-card status-card-${card.tone}${card.detail ? "" : " status-card-compact"}`}>
      <div className="status-card-header">
        <div className={`status-card-badge status-card-badge-${card.tone}`}>
          <StatusIcon icon={card.icon} />
        </div>
        <div className="status-card-copy">
          <p className="status-card-title">{card.title}</p>
          <p className="status-card-value">{card.value}</p>
        </div>
      </div>
      {card.detail ? <p className="status-card-detail">{card.detail}</p> : null}
    </article>
  );
}

export function TableBlock({
  table,
  hideTitle = false,
}: {
  table: NutritionQuestionnairePdfTable;
  hideTitle?: boolean;
}) {
  return (
    <div className="table-block">
      {!hideTitle || table.subtitle ? (
        <div className="table-block-header">
          {!hideTitle ? <h3>{table.title}</h3> : null}
          {table.subtitle ? <p>{table.subtitle}</p> : null}
        </div>
      ) : null}
      <table className={`data-table${table.compact ? " data-table-compact" : ""}`}>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={`${table.title}-${column}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${table.title}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${table.title}-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PdfBlock({
  block,
  hideTableTitle = false,
}: {
  block: NutritionQuestionnairePdfBlock;
  hideTableTitle?: boolean;
}) {
  switch (block.kind) {
    case "field-grid":
      return (
        <section className="content-block">
          <div className={`field-grid field-grid-${block.columns}`}>
            {block.fields.map((field) => (
              <div className="field-item" key={field.label}>
                <p className="meta-label">{field.label}</p>
                <p className={`field-value${field.accent ? " field-value-accent" : ""}`}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "checklist-grid":
      return (
        <section className="content-block">
          <div className={`checklist-grid checklist-grid-${Math.min(block.cards.length, 2)}`}>
            {block.cards.map((card) => (
              <ChecklistCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "gauge-grid":
      return (
        <section className="content-block">
          <div className="gauge-grid">
            {block.gauges.map((gauge) => (
              <div className="gauge-card" key={gauge.label}>
                <div className="gauge-header">
                  <p>{gauge.label}</p>
                  <span>{gauge.valueLabel}</span>
                </div>
                <div className="gauge-track">
                  <div className="gauge-fill" style={{ width: `${(gauge.value / 5) * 100}%` }} />
                </div>
                {gauge.description ? <p className="gauge-description">{gauge.description}</p> : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "detail-grid":
      return (
        <section className="content-block">
          <div className={`detail-grid detail-grid-${block.columns}`}>
            {block.entries.map((entry) => (
              <div className="detail-card" key={entry.label}>
                <p className="meta-label">{entry.label}</p>
                <p className={`detail-value${entry.accent ? " detail-value-accent" : ""}`}>
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "info-card-grid":
      return (
        <section className="content-block">
          <div className={`info-card-grid info-card-grid-${Math.min(block.cards.length, 3)}`}>
            {block.cards.map((card) => (
              <InfoCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "status-card-grid":
      return (
        <section className="content-block">
          <div className={`status-card-grid status-card-grid-${block.columns}`}>
            {block.cards.map((card) => (
              <StatusCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "table":
      return (
        <section className="content-block">
          <TableBlock hideTitle={hideTableTitle} table={block.table} />
        </section>
      );

    default:
      return null;
  }
}

export function PdfSection({ section }: { section: NutritionQuestionnairePdfSection }) {
  const hideContextTableTitles = Boolean(section.contextLabel);

  return (
    <section className="pdf-section">
      <SectionHeading contextLabel={section.contextLabel} title={section.title} />
      <div className="pdf-section-body">
        {section.blocks.map((block, index) => (
          <PdfBlock
            block={block}
            hideTableTitle={hideContextTableTitles}
            key={`${section.title}-${index}`}
          />
        ))}
      </div>
    </section>
  );
}

export function PdfPageHeader({ headerMeta }: { headerMeta: string }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        <div className="page-header-title">
          <span className="header-badge">
            <SpaIcon />
          </span>
          <h1>Evaluare NutriÈ›ionalÄƒ</h1>
        </div>
        <p className="page-header-meta">{headerMeta}</p>
      </div>
      <div className="page-header-side">
        <h2>Dr. Camelia È˜tefÄƒnescu</h2>
        <p>Specialist NutriÈ›ie È™i DieteticÄƒ</p>
      </div>
    </header>
  );
}

export function PdfPageFooter({
  footerLabel,
  footerReference,
  pageCount,
  pageNumber,
}: {
  footerLabel: string;
  footerReference: string;
  pageCount: number;
  pageNumber: number;
}) {
  return (
    <footer className="page-footer">
      <p>{footerLabel}</p>
      <div className="page-footer-meta">
        <span>
          Pagina {pageNumber} din {pageCount}
        </span>
        <span>Ref: {footerReference}</span>
      </div>
    </footer>
  );
}

export const nutritionQuestionnaireTemplateStyles = `
  :root {
    color-scheme: light;
    --background: #fbf9f4;
    --surface: #ffffff;
    --surface-low: #f5f4ed;
    --surface-container: #efeee6;
    --surface-container-high: #e8e9e0;
    --surface-container-highest: #e2e3d9;
    --outline: #797c73;
    --outline-variant: #b1b3a9;
    --on-surface: #31332c;
    --on-surface-variant: #5e6058;
    --primary: #5f5e5e;
    --primary-dim: #535252;
    --primary-container: #e4e2e1;
    --secondary: #735a42;
    --secondary-dim: #664f37;
    --secondary-container: #ffdcbd;
    --tertiary: #625f58;
    --tertiary-container: #f9f3ea;
    --page-shadow: 0 12px 32px rgba(49, 51, 44, 0.05);
  }

  ${"__FONT_FACES__"}

  * {
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    background: var(--background);
    color: var(--on-surface);
    font-family: "Manrope PDF", "Manrope", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  main {
    margin: 0;
    padding: 0;
  }

  .sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 9mm;
    margin: 0 auto;
    break-after: page;
    page-break-after: always;
  }

  .sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .page-card {
    height: calc(297mm - 18mm);
    background: var(--surface);
    border: 1px solid rgba(177, 179, 169, 0.25);
    border-radius: 16px;
    box-shadow: var(--page-shadow);
    padding: 11mm 14mm 9mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    border-bottom: 1px solid var(--surface-container-highest);
    padding-bottom: 7mm;
    margin-bottom: 4mm;
  }

  .page-header-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .page-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-badge {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--secondary-container);
    color: var(--secondary-dim);
    flex-shrink: 0;
  }

  .page-header h1,
  .section-heading h2 {
    margin: 0;
    font-family: "Newsreader PDF", "Newsreader", serif;
    color: var(--on-surface);
  }

  .page-header h1 {
    font-size: 34px;
    line-height: 1;
    font-weight: 500;
    letter-spacing: -0.04em;
  }

  .page-header-meta,
  .meta-label,
  .page-footer {
    font-family: "Manrope PDF", "Manrope", sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .page-header-meta {
    margin: 0;
    font-size: 10px;
    color: var(--outline);
    font-weight: 600;
  }

  .page-header-side {
    text-align: right;
    flex-shrink: 0;
  }

  .page-header-side h2 {
    margin: 0 0 3px;
    font-family: "Newsreader PDF", "Newsreader", serif;
    font-size: 20px;
    font-style: italic;
    font-weight: 500;
    color: var(--primary-dim);
  }

  .page-header-side p {
    margin: 0;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--outline);
    font-weight: 600;
  }

  .page-content {
    display: flex;
    flex-direction: column;
    gap: 10mm;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .pdf-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .pdf-section-body {
    display: flex;
    flex-direction: column;
    gap: 26px;
  }

  .content-block {
    display: flex;
    flex-direction: column;
    gap: 26px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .section-heading h2 {
    font-size: 23px;
    line-height: 1.05;
    font-weight: 500;
    font-style: italic;
    color: var(--secondary-dim);
    flex-shrink: 0;
  }

  .section-heading-side {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding-top: 3px;
  }

  .section-heading-context {
    margin: 0;
    align-self: flex-end;
    color: var(--outline);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    max-width: 100%;
    text-align: right;
    text-transform: uppercase;
  }

  .section-heading-line {
    width: 100%;
    height: 1px;
    background: var(--surface-container-highest);
    flex: 1;
  }

  .field-grid,
  .detail-grid,
  .checklist-grid,
  .info-card-grid,
  .status-card-grid {
    display: grid;
    gap: 24px;
  }

  .field-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .field-grid-2,
  .detail-grid-2,
  .checklist-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid-1,
  .checklist-grid-1 {
    grid-template-columns: 1fr;
  }

  .info-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-card-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-card-grid-1 {
    grid-template-columns: 1fr;
  }

  .status-card-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .info-card-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .info-card-grid-1 {
    grid-template-columns: 1fr;
  }

  .field-item,
  .detail-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .meta-label {
    margin: 0;
    color: var(--outline);
    font-size: 10px;
    font-weight: 600;
  }

  .field-value {
    margin: 0;
    color: var(--on-surface);
    font-size: 18px;
    line-height: 1.4;
    font-weight: 700;
    white-space: pre-wrap;
  }

  .field-value-accent,
  .detail-value-accent {
    color: var(--secondary);
  }

  .detail-card {
    background: var(--surface-low);
    border: 1px solid rgba(177, 179, 169, 0.18);
    border-radius: 14px;
    padding: 22px 20px;
    min-height: 110px;
  }

  .detail-value {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: var(--on-surface);
    white-space: pre-wrap;
  }

  .checklist-card {
    background: var(--surface-low);
    border: 1px solid rgba(177, 179, 169, 0.2);
    border-radius: 14px;
    padding: 24px;
  }

  .checklist-card h3,
  .table-block-header h3 {
    margin: 0 0 16px;
    font-size: 11px;
    font-weight: 700;
    color: var(--outline);
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .checklist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checklist li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: var(--on-surface);
    font-size: 14px;
    line-height: 1.6;
  }

  .checklist li span {
    white-space: pre-wrap;
  }

  .gauge-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px;
  }

  .gauge-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gauge-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }

  .gauge-header p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    font-weight: 600;
    color: var(--on-surface);
  }

  .gauge-header span {
    margin: 0;
    font-family: "Newsreader PDF", "Newsreader", serif;
    font-size: 24px;
    line-height: 1;
    font-style: italic;
    color: var(--primary);
    white-space: nowrap;
  }

  .gauge-track {
    width: 100%;
    height: 8px;
    background: var(--surface-container-high);
    border-radius: 999px;
    overflow: hidden;
  }

  .gauge-fill {
    height: 100%;
    background: var(--secondary-dim);
    border-radius: 999px;
  }

  .gauge-description {
    margin: 0;
    color: var(--outline);
    font-size: 12px;
    font-style: italic;
    line-height: 1.6;
    min-height: 19px;
    white-space: pre-wrap;
  }

  .info-card {
    border-radius: 14px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 144px;
  }

  .status-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid rgba(177, 179, 169, 0.22);
    background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,244,237,0.92) 100%);
    min-height: 78px;
  }

  .status-card-compact {
    gap: 0;
    min-height: 62px;
    padding: 10px 14px;
  }

  .status-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-card-compact .status-card-header {
    gap: 10px;
  }

  .status-card-badge {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .status-card-compact .status-card-badge {
    width: 36px;
    height: 36px;
    border-radius: 11px;
  }

  .status-card-badge-success {
    background: linear-gradient(135deg, #8fa26d 0%, #61764b 100%);
  }

  .status-card-badge-warning {
    background: linear-gradient(135deg, #c79d61 0%, #8d6734 100%);
  }

  .status-card-badge-danger {
    background: linear-gradient(135deg, #b76e5b 0%, #8a4332 100%);
  }

  .status-card-badge-neutral {
    background: linear-gradient(135deg, #8d8b86 0%, #5f5e5e 100%);
  }

  .status-card-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .status-card-title {
    margin: 0;
    color: var(--outline);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .status-card-value {
    margin: 0;
    color: var(--on-surface);
    font-size: 18px;
    line-height: 1.2;
    font-weight: 700;
  }

  .status-card-detail {
    margin: 0;
    color: var(--on-surface-variant);
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .info-card-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .info-card p {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .info-card-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-card-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    line-height: 1.55;
    color: currentColor;
  }

  .info-card-list li span {
    white-space: pre-wrap;
  }

  .info-card-note {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .info-card-tertiary {
    background: var(--tertiary-container);
    color: #5f5b55;
  }

  .info-card-secondary {
    background: var(--secondary-container);
    color: #654d35;
  }

  .info-card-primary {
    background: var(--primary-container);
    color: #525151;
  }

  .table-block {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .table-block-header p {
    margin: 0;
    color: var(--outline);
    font-size: 12px;
    font-style: italic;
    line-height: 1.6;
  }

  .data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    text-align: left;
    overflow: hidden;
  }

  .data-table thead {
    display: table-header-group;
  }

  .data-table th {
    background: var(--surface-container);
    color: var(--on-surface-variant);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    padding: 16px 18px;
  }

  .data-table th:first-child {
    border-top-left-radius: 12px;
  }

  .data-table th:last-child {
    border-top-right-radius: 12px;
  }

  .data-table td {
    padding: 18px;
    border-bottom: 1px solid var(--surface-container-high);
    font-size: 13px;
    line-height: 1.65;
    color: var(--on-surface);
    vertical-align: top;
  }

  .data-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .data-table td:first-child {
    font-weight: 700;
  }

  .data-table-compact td:first-child {
    font-weight: 600;
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    border-top: 1px solid var(--surface-container-highest);
    padding-top: 6mm;
    margin-top: 10px;
    color: var(--outline);
    font-size: 10px;
    font-weight: 600;
  }

  .page-footer span {
    white-space: nowrap;
  }

  .page-footer-meta {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .icon {
    display: inline-block;
    flex-shrink: 0;
  }

  .icon-spa {
    width: 22px;
    height: 22px;
  }

  .icon-check-circle {
    width: 18px;
    height: 18px;
    color: var(--primary);
    margin-top: 2px;
  }

  .icon-card {
    width: 16px;
    height: 16px;
  }

  .icon-status {
    width: 22px;
    height: 22px;
  }
`;

export function NutritionQuestionnairePdfTemplate({
  fontFacesCss,
  model,
}: NutritionQuestionnaireTemplateProps) {
  const styles = nutritionQuestionnaireTemplateStyles.replace(
    "__FONT_FACES__",
    fontFacesCss,
  );

  return (
    <html className="light" lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Evaluare Nutrițională</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <main>
          {model.pages.map((page) => (
            <section className="sheet" key={`pdf-page-${page.number}`}>
              <div className="page-card">
                <header className="page-header">
                  <div className="page-header-main">
                    <div className="page-header-title">
                      <span className="header-badge">
                        <SpaIcon />
                      </span>
                      <h1>Evaluare Nutrițională</h1>
                    </div>
                    <p className="page-header-meta">{model.headerMeta}</p>
                  </div>
                  <div className="page-header-side">
                    <h2>Dr. Camelia Ștefănescu</h2>
                    <p>Specialist Nutriție și Dietetică</p>
                  </div>
                </header>

                <div className="page-content">
                  {page.sections.map((section, index) => (
                    <PdfSection section={section} key={`${page.number}-${section.title}-${index}`} />
                  ))}
                </div>

                <footer className="page-footer">
                  <p>{model.footerLabel}</p>
                  <div className="page-footer-meta">
                    <span>
                      Pagina {page.number} din {model.pages.length}
                    </span>
                    <span>Ref: {model.footerReference}</span>
                  </div>
                </footer>
              </div>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}
