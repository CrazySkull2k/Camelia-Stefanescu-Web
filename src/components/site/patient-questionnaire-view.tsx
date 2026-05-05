import type {
  NutritionQuestionnairePdfBlock,
  NutritionQuestionnairePdfChecklistCard,
  NutritionQuestionnairePdfInfoCard,
  NutritionQuestionnairePdfModel,
  NutritionQuestionnairePdfSection,
  NutritionQuestionnairePdfStatusCard,
  NutritionQuestionnairePdfTable,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";

import styles from "./patient-questionnaire-view.module.css";

type PatientQuestionnaireViewProps = {
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

function SectionHeading({
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

function InfoCard({ card }: { card: NutritionQuestionnairePdfInfoCard }) {
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

function TableBlock({
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
      <div className="table-scroll">
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
    </div>
  );
}

function QuestionnaireBlock({
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

function QuestionnaireSection({ section }: { section: NutritionQuestionnairePdfSection }) {
  const hideContextTableTitles = Boolean(section.contextLabel);

  return (
    <section className="pdf-section">
      <SectionHeading contextLabel={section.contextLabel} title={section.title} />
      <div className="pdf-section-body">
        {section.blocks.map((block, index) => (
          <QuestionnaireBlock
            block={block}
            hideTableTitle={hideContextTableTitles}
            key={`${section.title}-${index}`}
          />
        ))}
      </div>
    </section>
  );
}

export function PatientQuestionnaireView({ model }: PatientQuestionnaireViewProps) {
  return (
    <div className={styles.viewer}>
      <div className="viewer-stack">
        {model.pages.map((page) => (
          <section className="sheet" key={`patient-questionnaire-page-${page.number}`}>
            <div className="page-card">
              <header className="page-header">
                <div className="page-header-main">
                  <div className="page-header-title">
                    <span className="header-badge">
                      <SpaIcon />
                    </span>
                    <h1>Evaluare Nutritionala</h1>
                  </div>
                  <p className="page-header-meta">{model.headerMeta}</p>
                </div>
                <div className="page-header-side">
                  <h2>Dr. Camelia Stefanescu</h2>
                  <p>Specialist nutritie si dietetica</p>
                </div>
              </header>

              <div className="page-content">
                {page.sections.map((section, index) => (
                  <QuestionnaireSection
                    key={`${page.number}-${section.title}-${index}`}
                    section={section}
                  />
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
      </div>
    </div>
  );
}
