import type {
  NutritionQuestionnairePdfBlock,
  NutritionQuestionnairePdfChecklistCard,
  NutritionQuestionnairePdfInfoCard,
  NutritionQuestionnairePdfModel,
  NutritionQuestionnairePdfSection,
  NutritionQuestionnairePdfStatusCard,
  NutritionQuestionnairePdfTable,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";

type NutritionQuestionnaireSimpleTemplateProps = {
  fontFacesCss: string;
  model: NutritionQuestionnairePdfModel;
};

function SimpleSectionHeading({
  title,
  contextLabel,
}: {
  title: string;
  contextLabel?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {contextLabel ? <p className="section-context">{contextLabel}</p> : null}
    </div>
  );
}

function SimpleChecklistCard({
  card,
}: {
  card: NutritionQuestionnairePdfChecklistCard;
}) {
  return (
    <div className="list-group">
      <p className="meta-label">{card.title}</p>
      <ul className="simple-list">
        {card.items.map((item) => (
          <li key={`${card.title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SimpleInfoCard({
  card,
}: {
  card: NutritionQuestionnairePdfInfoCard;
}) {
  return (
    <div className="flow-group">
      <p className="meta-label">{card.title}</p>
      {card.items.length ? (
        <ul className="simple-list">
          {card.items.map((item) => (
            <li key={`${card.title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : card.value ? (
        <p className="body-text">{card.value}</p>
      ) : null}
      {card.note ? <p className="body-text body-note">{card.note}</p> : null}
    </div>
  );
}

function SimpleStatusCard({
  card,
}: {
  card: NutritionQuestionnairePdfStatusCard;
}) {
  return (
    <div className="flow-group">
      <p className="meta-label">{card.title}</p>
      <p className="value-strong">{card.value}</p>
      {card.detail ? <p className="body-text body-note">{card.detail}</p> : null}
    </div>
  );
}

function SimpleTableBlock({
  table,
  hideTitle = false,
}: {
  table: NutritionQuestionnairePdfTable;
  hideTitle?: boolean;
}) {
  return (
    <div className="table-wrap">
      {!hideTitle || table.subtitle ? (
        <div className="table-head">
          {!hideTitle ? <p className="meta-label">{table.title}</p> : null}
          {table.subtitle ? <p className="table-subtitle">{table.subtitle}</p> : null}
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

function SimpleBlock({
  block,
  hideTableTitle = false,
}: {
  block: NutritionQuestionnairePdfBlock;
  hideTableTitle?: boolean;
}) {
  switch (block.kind) {
    case "field-grid":
      return (
        <section className="block">
          <div className={`grid grid-${block.columns}`}>
            {block.fields.map((field) => (
              <div className="flow-group flow-group-separated" key={field.label}>
                <p className="meta-label">{field.label}</p>
                <p className={`value-main${field.accent ? " value-accent" : ""}`}>
                  {field.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "checklist-grid":
      return (
        <section className="block">
          <div className={`grid grid-${Math.min(block.cards.length, 2)}`}>
            {block.cards.map((card) => (
              <SimpleChecklistCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "gauge-grid":
      return (
        <section className="block">
          <div className="grid grid-2">
            {block.gauges.map((gauge) => (
              <div className="gauge-group" key={gauge.label}>
                <div className="gauge-head">
                  <p className="meta-label">{gauge.label}</p>
                  <span className="gauge-value">{gauge.valueLabel}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{ width: `${(gauge.value / 5) * 100}%` }}
                  />
                </div>
                {gauge.description ? (
                  <p className="body-text body-note">{gauge.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "detail-grid":
      return (
        <section className="block">
          <div className={`grid grid-${block.columns}`}>
            {block.entries.map((entry) => (
              <div className="flow-group flow-group-separated" key={entry.label}>
                <p className="meta-label">{entry.label}</p>
                <p className={`body-text${entry.accent ? " value-accent" : ""}`}>
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    case "info-card-grid":
      return (
        <section className="block">
          <div className={`grid grid-${Math.min(block.cards.length, 3)}`}>
            {block.cards.map((card) => (
              <SimpleInfoCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "status-card-grid":
      return (
        <section className="block">
          <div className={`grid grid-${block.columns}`}>
            {block.cards.map((card) => (
              <SimpleStatusCard card={card} key={card.title} />
            ))}
          </div>
        </section>
      );

    case "table":
      return (
        <section className="block">
          <SimpleTableBlock hideTitle={hideTableTitle} table={block.table} />
        </section>
      );

    default:
      return null;
  }
}

function SimpleSection({
  section,
}: {
  section: NutritionQuestionnairePdfSection;
}) {
  const hideTableTitle = Boolean(section.contextLabel);

  return (
    <section className="section">
      <SimpleSectionHeading contextLabel={section.contextLabel} title={section.title} />
      <div className="section-body">
        {section.blocks.map((block, index) => (
          <SimpleBlock
            block={block}
            hideTableTitle={hideTableTitle}
            key={`${section.title}-${index}`}
          />
        ))}
      </div>
    </section>
  );
}

const templateStyles = `
  :root {
    color-scheme: light;
    --text: #31332c;
    --muted: #6a6d64;
    --line: #dedbcc;
    --line-strong: #c9c4b4;
    --accent: #664f37;
    --surface: #ffffff;
    --surface-soft: #faf8f2;
  }

  ${"__FONT_FACES__"}

  * {
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 14mm 12mm 16mm;
  }

  body {
    margin: 0;
    color: var(--text);
    background: var(--surface);
    font-family: "Manrope PDF", "Manrope", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  main {
    margin: 0;
    padding: 0;
  }

  .document {
    display: flex;
    flex-direction: column;
    gap: 8mm;
  }

  .document-meta {
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 3mm;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }

  .document-meta h1 {
    margin: 0;
    font-family: "Newsreader PDF", "Newsreader", serif;
    font-size: 20px;
    line-height: 1.05;
    font-weight: 500;
    color: var(--text);
  }

  .document-meta p {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.6;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 3mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8mm;
    border-bottom: 1px solid var(--line);
    padding-bottom: 2.5mm;
  }

  .section-heading h2 {
    margin: 0;
    font-family: "Newsreader PDF", "Newsreader", serif;
    font-size: 20px;
    line-height: 1.05;
    font-style: italic;
    font-weight: 500;
    color: var(--accent);
  }

  .section-context {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: right;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 3mm;
  }

  .block {
    display: flex;
    flex-direction: column;
    gap: 3mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .grid {
    display: grid;
    gap: 3mm 5mm;
  }

  .grid-1 {
    grid-template-columns: 1fr;
  }

  .grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .flow-group,
  .gauge-group,
  .list-group {
    display: flex;
    flex-direction: column;
    gap: 2mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .flow-group-separated {
    padding-bottom: 2.5mm;
    border-bottom: 1px solid rgba(222, 219, 204, 0.85);
  }

  .list-group {
    gap: 2.5mm;
  }

  .gauge-group {
    gap: 2.5mm;
    padding-bottom: 2.5mm;
  }

  .meta-label {
    margin: 0;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .value-main,
  .value-strong {
    margin: 0;
    color: var(--text);
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .value-main {
    font-size: 16px;
    font-weight: 700;
  }

  .value-strong {
    font-size: 15px;
    font-weight: 700;
  }

  .value-accent {
    color: var(--accent);
  }

  .body-text {
    margin: 0;
    color: var(--text);
    font-size: 12px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .body-note {
    color: var(--muted);
  }

  .simple-list {
    margin: 0;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
  }

  .simple-list li {
    color: var(--text);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .gauge-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4mm;
  }

  .gauge-value {
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  .gauge-track {
    width: 100%;
    height: 6px;
    background: #ece8dc;
    border-radius: 999px;
    overflow: hidden;
  }

  .gauge-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 999px;
  }

  .table-wrap {
    display: flex;
    flex-direction: column;
    gap: 2.5mm;
  }

  .table-head {
    display: flex;
    flex-direction: column;
    gap: 1.5mm;
  }

  .table-subtitle {
    margin: 0;
    color: var(--muted);
    font-size: 11px;
    line-height: 1.5;
    font-style: italic;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .data-table th,
  .data-table td {
    border: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }

  .data-table th {
    padding: 8px 10px;
    color: var(--muted);
    background: #f3efe4;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .data-table td {
    padding: 10px;
    color: var(--text);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .data-table td:first-child {
    font-weight: 700;
  }
`;

export function NutritionQuestionnaireSimplePdfTemplate({
  fontFacesCss,
  model,
}: NutritionQuestionnaireSimpleTemplateProps) {
  const styles = templateStyles.replace("__FONT_FACES__", fontFacesCss);
  const sections = model.pages.flatMap((page, pageIndex) =>
    page.sections.map((section, sectionIndex) => ({
      key: `${page.number}-${section.title}-${pageIndex}-${sectionIndex}`,
      section,
    })),
  );

  return (
    <html className="light" lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Chestionar Evaluare Nutritionala</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <main>
          <div className="document">
            <section className="document-meta">
              <h1>Chestionar Evaluare Nutritionala</h1>
              <p>
                Pacient: {model.patientName}
                {" • "}
                Completat: {model.submittedAtLabel}
              </p>
            </section>

            {sections.map(({ key, section }) => (
              <SimpleSection key={key} section={section} />
            ))}
          </div>
        </main>
      </body>
    </html>
  );
}
