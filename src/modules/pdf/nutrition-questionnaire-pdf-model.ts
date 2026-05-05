import "server-only";

type PayloadValue = Record<string, unknown>[string];

export type NutritionQuestionnairePdfField = {
  label: string;
  value: string;
  accent?: boolean;
};

export type NutritionQuestionnairePdfChecklistCard = {
  title: string;
  items: string[];
};

export type NutritionQuestionnairePdfGauge = {
  label: string;
  value: number;
  valueLabel: string;
  description?: string;
};

export type NutritionQuestionnairePdfDetailEntry = {
  label: string;
  value: string;
  accent?: boolean;
};

export type NutritionQuestionnairePdfInfoCardTone =
  | "tertiary"
  | "secondary"
  | "primary";

export type NutritionQuestionnairePdfInfoCard = {
  title: string;
  value?: string;
  items: string[];
  note?: string;
  tone: NutritionQuestionnairePdfInfoCardTone;
};

export type NutritionQuestionnairePdfStatusCardTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type NutritionQuestionnairePdfStatusCardIcon =
  | "smoking"
  | "alcohol"
  | "medical"
  | "supplement"
  | "activity"
  | "appetite"
  | "cycle"
  | "care";

export type NutritionQuestionnairePdfStatusCard = {
  title: string;
  value: string;
  detail?: string;
  tone: NutritionQuestionnairePdfStatusCardTone;
  icon: NutritionQuestionnairePdfStatusCardIcon;
};

export type NutritionQuestionnairePdfTable = {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
  compact?: boolean;
};

export type NutritionQuestionnairePdfBlock =
  | {
      kind: "field-grid";
      fields: NutritionQuestionnairePdfField[];
      columns: 2 | 3;
    }
  | {
      kind: "checklist-grid";
      cards: NutritionQuestionnairePdfChecklistCard[];
    }
  | {
      kind: "gauge-grid";
      gauges: NutritionQuestionnairePdfGauge[];
    }
  | {
      kind: "detail-grid";
      entries: NutritionQuestionnairePdfDetailEntry[];
      columns: 1 | 2;
    }
  | {
      kind: "info-card-grid";
      cards: NutritionQuestionnairePdfInfoCard[];
    }
  | {
      kind: "status-card-grid";
      cards: NutritionQuestionnairePdfStatusCard[];
      columns: 1 | 2 | 3;
    }
  | {
      kind: "table";
      table: NutritionQuestionnairePdfTable;
    };

export type NutritionQuestionnairePdfSection = {
  title: string;
  contextLabel?: string;
  blocks: NutritionQuestionnairePdfBlock[];
};

export type NutritionQuestionnairePdfPage = {
  number: number;
  sections: NutritionQuestionnairePdfSection[];
};

export type NutritionQuestionnairePdfModel = {
  patientName: string;
  submittedAtLabel: string;
  headerMeta: string;
  footerReference: string;
  footerLabel: string;
  pages: NutritionQuestionnairePdfPage[];
};

export type NutritionQuestionnairePdfDocumentModel = Omit<
  NutritionQuestionnairePdfModel,
  "pages"
> & {
  sections: NutritionQuestionnairePdfSection[];
};

const NUTRITION_PAGE_CAPACITY = 11.4;
const NUTRITION_PAGE_FOOTER_BUFFER = 2.2;
const NUTRITION_PAGE_DETAIL_FOOTER_BUFFER = 4.4;
const NUTRITION_PAGE_CHECKLIST_FOOTER_BUFFER = 4.8;
const MM_PER_PX = 25.4 / 96;
const PDF_PAGE_CARD_HEIGHT_MM = 279;
const PDF_PAGE_CARD_PADDING_TOP_MM = 11;
const PDF_PAGE_CARD_PADDING_BOTTOM_MM = 9;
const PDF_PAGE_CARD_INNER_HEIGHT_MM =
  PDF_PAGE_CARD_HEIGHT_MM - PDF_PAGE_CARD_PADDING_TOP_MM - PDF_PAGE_CARD_PADDING_BOTTOM_MM;
const PDF_PAGE_HEADER_TITLE_ROW_HEIGHT_MM = 38 * MM_PER_PX;
const PDF_PAGE_HEADER_META_HEIGHT_MM = 12 * MM_PER_PX;
const PDF_PAGE_HEADER_MAIN_GAP_MM = 8 * MM_PER_PX;
const PDF_PAGE_HEADER_BORDER_MM = 1 * MM_PER_PX;
const PDF_PAGE_HEADER_PADDING_BOTTOM_MM = 7;
const PDF_PAGE_HEADER_MARGIN_BOTTOM_MM = 4;
const PDF_PAGE_HEADER_HEIGHT_MM =
  PDF_PAGE_HEADER_TITLE_ROW_HEIGHT_MM +
  PDF_PAGE_HEADER_MAIN_GAP_MM +
  PDF_PAGE_HEADER_META_HEIGHT_MM +
  PDF_PAGE_HEADER_BORDER_MM +
  PDF_PAGE_HEADER_PADDING_BOTTOM_MM +
  PDF_PAGE_HEADER_MARGIN_BOTTOM_MM;
const PDF_PAGE_FOOTER_MARGIN_TOP_MM = 10 * MM_PER_PX;
const PDF_PAGE_FOOTER_BORDER_MM = 1 * MM_PER_PX;
const PDF_PAGE_FOOTER_PADDING_TOP_MM = 6;
const PDF_PAGE_FOOTER_TEXT_HEIGHT_MM = 12 * MM_PER_PX;
const PDF_PAGE_FOOTER_HEIGHT_MM =
  PDF_PAGE_FOOTER_MARGIN_TOP_MM +
  PDF_PAGE_FOOTER_BORDER_MM +
  PDF_PAGE_FOOTER_PADDING_TOP_MM +
  PDF_PAGE_FOOTER_TEXT_HEIGHT_MM;
const PDF_PAGE_CONTENT_HEIGHT_MM =
  PDF_PAGE_CARD_INNER_HEIGHT_MM - PDF_PAGE_HEADER_HEIGHT_MM - PDF_PAGE_FOOTER_HEIGHT_MM;
const PDF_SECTION_HEADING_HEIGHT_MM = Math.max(
  23 * 1.05 * MM_PER_PX,
  3 * MM_PER_PX + 10 * 1.2 * MM_PER_PX + 8 * MM_PER_PX + 1 * MM_PER_PX,
);
const PDF_SECTION_GAP_MM = 20 * MM_PER_PX;
const PDF_SECTION_BODY_HEIGHT_MM =
  PDF_PAGE_CONTENT_HEIGHT_MM - PDF_SECTION_HEADING_HEIGHT_MM - PDF_SECTION_GAP_MM;
const PDF_SECTION_BODY_BLOCK_GAP_MM = 26 * MM_PER_PX;
const PDF_TABLE_SUBTITLE_HEIGHT_MM = 12 * 1.6 * MM_PER_PX;
const PDF_TABLE_SUBTITLE_GAP_MM = 18 * MM_PER_PX;
const PDF_TABLE_HEADER_HEIGHT_MM = (16 * 2 + 10 * 1.2) * MM_PER_PX;
const PDF_TABLE_ROW_BASE_HEIGHT_MM = (18 * 2 + 13 * 1.45 + 1) * MM_PER_PX;
const PDF_TABLE_ROW_EXTRA_LINE_HEIGHT_MM = 13 * 1.45 * MM_PER_PX;
const PDF_DETAIL_CARD_VERTICAL_PADDING_MM = 22 * 2 * MM_PER_PX;
const PDF_DETAIL_CARD_GAP_MM = 6 * MM_PER_PX;
const PDF_DETAIL_LABEL_LINE_HEIGHT_MM = 12 * MM_PER_PX;
const PDF_DETAIL_VALUE_LINE_HEIGHT_MM = 14 * 1.8 * MM_PER_PX;
const PDF_DETAIL_GRID_ROW_GAP_MM = 24 * MM_PER_PX;

function asString(value: PayloadValue) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asArray(value: PayloadValue) {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }

  const singleValue = asString(value);
  return singleValue ? [singleValue] : [];
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ro-RO").format(parsed);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function compactJoin(parts: Array<string | null | undefined>, separator = " • ") {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(separator);
}

function withSuffix(value: string | null, suffix: string) {
  return value ? `${value} ${suffix}` : null;
}

function normalizeSex(value: string | null) {
  if (value === "F") {
    return "Feminin";
  }

  if (value === "M") {
    return "Masculin";
  }

  return value;
}

function buildParallelRows(
  payload: Record<string, unknown>,
  columns: Array<{ key: string; transform?: (value: string) => string }>,
) {
  const values = columns.map((column) => asArray(payload[column.key]));
  const rowCount = Math.max(0, ...values.map((rows) => rows.length));

  return Array.from({ length: rowCount }, (_, index) =>
    columns.map((column, columnIndex) => {
      const value = values[columnIndex]?.[index] ?? "";
      return column.transform ? column.transform(value) : value;
    }),
  ).filter((row) => row.some((value) => value.trim().length));
}

function chunkArray<T>(items: T[], size: number) {
  if (!items.length) {
    return [];
  }

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function estimateTextLines(value: string, charsPerLine: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized.length) {
    return 1;
  }

  return Math.max(1, Math.ceil(normalized.length / charsPerLine));
}

function buildGauge(
  label: string,
  rawValue: string | null,
  description?: string | null,
): NutritionQuestionnairePdfGauge | null {
  if (!rawValue) {
    return null;
  }

  const numericValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const clampedValue = Math.min(5, Math.max(1, numericValue));

  return {
    label,
    value: clampedValue,
    valueLabel: `${clampedValue} / 5`,
    description: description ?? undefined,
  };
}

function createFieldGridBlock(
  fields: NutritionQuestionnairePdfField[],
  columns: 2 | 3,
): NutritionQuestionnairePdfBlock | null {
  if (!fields.length) {
    return null;
  }

  return {
    kind: "field-grid",
    fields,
    columns,
  };
}

function createChecklistGridBlock(
  cards: NutritionQuestionnairePdfChecklistCard[],
): NutritionQuestionnairePdfBlock | null {
  if (!cards.length) {
    return null;
  }

  return {
    kind: "checklist-grid",
    cards,
  };
}

function createGaugeGridBlock(
  gauges: NutritionQuestionnairePdfGauge[],
): NutritionQuestionnairePdfBlock | null {
  if (!gauges.length) {
    return null;
  }

  return {
    kind: "gauge-grid",
    gauges,
  };
}

function createDetailGridBlocks(
  entries: NutritionQuestionnairePdfDetailEntry[],
  columns: 1 | 2,
  chunkSize = columns === 2 ? 4 : 3,
) {
  if (!entries.length) {
    return [];
  }

  return chunkArray(entries, chunkSize).map(
    (chunk): NutritionQuestionnairePdfBlock => ({
      kind: "detail-grid",
      entries: chunk,
      columns,
    }),
  );
}

function createInfoCardGridBlock(
  cards: NutritionQuestionnairePdfInfoCard[],
): NutritionQuestionnairePdfBlock | null {
  if (!cards.length) {
    return null;
  }

  return {
    kind: "info-card-grid",
    cards,
  };
}

function createStatusCardGridBlock(
  cards: NutritionQuestionnairePdfStatusCard[],
  columns: 1 | 2 | 3 = 2,
): NutritionQuestionnairePdfBlock | null {
  if (!cards.length) {
    return null;
  }

  return {
    kind: "status-card-grid",
    cards,
    columns,
  };
}

type TableBlockOptions = {
  firstPageReservedHeightMm?: number;
  continuationSubtitle?: string;
};

function estimateDetailEntryHeightMm(
  entry: NutritionQuestionnairePdfDetailEntry,
  columns: 1 | 2,
) {
  const labelLines = estimateTextLines(entry.label, columns === 2 ? 44 : 82);
  const valueLines = estimateTextLines(entry.value, columns === 2 ? 60 : 96);

  return (
    PDF_DETAIL_CARD_VERTICAL_PADDING_MM +
    PDF_DETAIL_CARD_GAP_MM +
    labelLines * PDF_DETAIL_LABEL_LINE_HEIGHT_MM +
    valueLines * PDF_DETAIL_VALUE_LINE_HEIGHT_MM
  );
}

function estimateDetailGridHeightMm(
  entries: NutritionQuestionnairePdfDetailEntry[],
  columns: 1 | 2,
) {
  if (!entries.length) {
    return 0;
  }

  const rowHeights = chunkArray(
    entries.map((entry) => estimateDetailEntryHeightMm(entry, columns)),
    columns,
  ).map((row) => Math.max(...row));

  return (
    rowHeights.reduce((total, rowHeight) => total + rowHeight, 0) +
    Math.max(0, rowHeights.length - 1) * PDF_DETAIL_GRID_ROW_GAP_MM
  );
}

function estimateTableRowUnits(table: NutritionQuestionnairePdfTable, row: string[]) {
  const charsPerCell =
    table.columns.length >= 4
      ? [10, 40, 18, 8]
      : table.columns.length === 2
        ? [34, 42]
        : [92];

  const maxLines = Math.max(
    ...row.map((cell, index) =>
      estimateTextLines(cell, charsPerCell[Math.min(index, charsPerCell.length - 1)]),
    ),
  );

  return (
    PDF_TABLE_ROW_BASE_HEIGHT_MM +
    Math.max(0, maxLines - 1) * PDF_TABLE_ROW_EXTRA_LINE_HEIGHT_MM
  );
}

function estimateTableHeaderUnits(
  table: NutritionQuestionnairePdfTable,
  hasSubtitle = Boolean(table.subtitle),
) {
  return (
    PDF_TABLE_HEADER_HEIGHT_MM +
    (hasSubtitle ? PDF_TABLE_SUBTITLE_HEIGHT_MM + PDF_TABLE_SUBTITLE_GAP_MM : 0)
  );
}

function createTableBlocks(
  table: NutritionQuestionnairePdfTable,
  options?: TableBlockOptions,
) {
  if (!table.rows.length) {
    return [];
  }

  const blocks: NutritionQuestionnairePdfBlock[] = [];
  let pageIndex = 0;
  let rowIndex = 0;

  while (rowIndex < table.rows.length) {
    const hasContinuationSubtitle = pageIndex > 0 && Boolean(options?.continuationSubtitle);
    const headerUnits = estimateTableHeaderUnits(table, hasContinuationSubtitle);
    const reservedUnits =
      pageIndex === 0 ? options?.firstPageReservedHeightMm ?? 0 : 0;
    const maxUnits = Math.max(
      PDF_TABLE_ROW_BASE_HEIGHT_MM,
      PDF_SECTION_BODY_HEIGHT_MM - reservedUnits - headerUnits,
    );

    const pageRows: string[][] = [];
    let currentUnits = 0;

    while (rowIndex < table.rows.length) {
      const row = table.rows[rowIndex];
      const rowUnits = estimateTableRowUnits(table, row);

      if (pageRows.length > 0 && currentUnits + rowUnits > maxUnits) {
        break;
      }

      pageRows.push(row);
      currentUnits += rowUnits;
      rowIndex += 1;
    }

    if (!pageRows.length) {
      pageRows.push(table.rows[rowIndex]);
      rowIndex += 1;
    }

    blocks.push({
      kind: "table",
      table: {
        ...table,
        subtitle: hasContinuationSubtitle
          ? options?.continuationSubtitle
          : table.subtitle,
        rows: pageRows,
      },
    });

    pageIndex += 1;
  }

  return blocks;
}

function isTableBlock(
  block: NutritionQuestionnairePdfBlock,
): block is Extract<NutritionQuestionnairePdfBlock, { kind: "table" }> {
  return block.kind === "table";
}

function estimateBlockUnits(block: NutritionQuestionnairePdfBlock) {
  switch (block.kind) {
    case "field-grid":
      return Math.max(3.6, Math.ceil(block.fields.length / block.columns) * 1.3 + 1.8);

    case "checklist-grid":
      return Math.max(
        4.2,
        block.cards.reduce(
          (total, card) =>
            total +
            Math.max(
              1.8,
              1.1 +
                card.items.reduce(
                  (itemTotal, item) =>
                    itemTotal + Math.max(0.72, estimateTextLines(item, 54) * 0.7),
                  0,
                ),
            ),
          0,
        ),
      );

    case "gauge-grid":
      return Math.max(3.2, block.gauges.length * 1.45 + 0.8);

    case "detail-grid": {
      const entryUnits = block.entries.map((entry) =>
        Math.max(
          1.15,
          estimateTextLines(entry.label, block.columns === 2 ? 44 : 82) * 0.38 +
            estimateTextLines(entry.value, block.columns === 2 ? 60 : 96) * 0.82,
        ),
      );
      const rowUnits = chunkArray(entryUnits, block.columns).reduce(
        (total, row) => total + Math.max(...row),
        0,
      );

      return Math.max(2.4, rowUnits + 0.55);
    }

    case "info-card-grid":
      return Math.max(
        3.6,
        chunkArray(
          block.cards.map((card) =>
            Math.max(
              1.9,
              0.95 +
                estimateTextLines(card.title, 28) * 0.38 +
                card.items.reduce(
                  (itemsTotal, item) =>
                    itemsTotal + Math.max(0.82, estimateTextLines(item, 22) * 0.72),
                  0,
                ) +
                (card.note ? estimateTextLines(card.note, 26) * 0.9 + 0.35 : 0) +
                (card.value ? estimateTextLines(card.value, 72) * 0.78 : 0),
            ),
          ),
          3,
        ).reduce((total, row) => total + Math.max(...row), 0),
      );

    case "status-card-grid": {
      const cardUnits = block.cards.map((card) =>
        Math.max(
          1.5,
          0.9 +
            estimateTextLines(card.title, 28) * 0.34 +
            estimateTextLines(card.value, 34) * 0.58 +
            estimateTextLines(card.detail ?? "", 54) * 0.52,
        ),
      );
      const rowUnits = chunkArray(cardUnits, block.columns).reduce(
        (total, row) => total + Math.max(...row),
        0,
      );

      return Math.max(2.8, rowUnits + 0.8);
    }

    case "table":
      return (
        estimateTableHeaderUnits(block.table) +
        block.table.rows.reduce(
          (total, row) => total + estimateTableRowUnits(block.table, row),
          0,
        )
      );
  }
}

function createSection(
  title: string,
  blocks: Array<NutritionQuestionnairePdfBlock | null | undefined>,
  contextLabel?: string,
): NutritionQuestionnairePdfSection | null {
  const compactBlocks = blocks.filter(
    (block): block is NutritionQuestionnairePdfBlock => Boolean(block),
  );

  if (!compactBlocks.length) {
    return null;
  }

  return {
    title,
    contextLabel,
    blocks: compactBlocks,
  };
}

function buildNutritionCards(payload: Record<string, unknown>) {
  const grasimiItems = asArray(payload["grasimi[]"]);
  const bauturiNote = asString(payload.bauturi_altele_text);
  const bauturiItems = [
    ...asArray(payload["bauturi[]"]),
  ];
  const pofteNote = asString(payload.pofte_altele_text);
  const pofteItems = [
    ...asArray(payload["pofte[]"]),
  ];

  const cards: Array<NutritionQuestionnairePdfInfoCard | null> = [
    grasimiItems.length
      ? {
          title: "Grăsimi / uleiuri",
          items: grasimiItems,
          tone: "primary" as const,
        }
      : null,
    bauturiItems.length || Boolean(bauturiNote)
      ? {
          title: "Băuturi regulate",
          items: bauturiItems,
          note: bauturiNote ?? undefined,
          tone: "tertiary" as const,
        }
      : null,
    pofteItems.length || Boolean(pofteNote)
      ? {
          title: "Pofte alimentare",
          items: pofteItems,
          note: pofteNote ?? undefined,
          tone: "secondary" as const,
        }
      : null,
  ];

  return cards.filter((card): card is NutritionQuestionnairePdfInfoCard => card !== null);
}

function buildStatusValue(value: string | null, positiveLabel: string, negativeLabel: string) {
  if (value === "Da") {
    return positiveLabel;
  }

  if (value === "Nu") {
    return negativeLabel;
  }

  return value;
}

function buildStatusTone(value: string | null, positive: NutritionQuestionnairePdfStatusCardTone, negative: NutritionQuestionnairePdfStatusCardTone) {
  if (value === "Da") {
    return positive;
  }

  if (value === "Nu") {
    return negative;
  }

  return "neutral";
}

function createStatusCard(input: NutritionQuestionnairePdfStatusCard | null) {
  return input;
}

function paginateNutritionSection(
  sectionTitle: string,
  blocks: NutritionQuestionnairePdfBlock[],
  startPageNumber: number,
) {
  const pages: NutritionQuestionnairePdfPage[] = [];
  let currentBlocks: NutritionQuestionnairePdfBlock[] = [];
  let currentUnits = 0;

  function canUseFooterBuffer(
    nextBlock: NutritionQuestionnairePdfBlock,
    nextUnits: number,
  ) {
    if (!currentBlocks.length || nextBlock.kind === "table") {
      return false;
    }

    const overflow = currentUnits + nextUnits - NUTRITION_PAGE_CAPACITY;
    const allowedOverflow =
      nextBlock.kind === "checklist-grid"
        ? NUTRITION_PAGE_CHECKLIST_FOOTER_BUFFER
        : nextBlock.kind === "detail-grid"
          ? NUTRITION_PAGE_DETAIL_FOOTER_BUFFER
          : NUTRITION_PAGE_FOOTER_BUFFER;

    if (overflow > allowedOverflow) {
      return false;
    }

    return currentBlocks.every(
      (block) =>
        block.kind === "status-card-grid" ||
        block.kind === "detail-grid" ||
        block.kind === "info-card-grid" ||
        block.kind === "checklist-grid",
    );
  }

  function flushCurrentBlocks() {
    if (!currentBlocks.length) {
      return;
    }

    pages.push({
      number: startPageNumber + pages.length,
      sections: [
        {
          title: sectionTitle,
          blocks: currentBlocks,
        },
      ],
    });
    currentBlocks = [];
    currentUnits = 0;
  }

  for (const block of blocks) {
    if (block.kind === "table") {
      flushCurrentBlocks();
      pages.push({
        number: startPageNumber + pages.length,
        sections: [
          {
            title: sectionTitle,
            contextLabel: block.table.title,
            blocks: [block],
          },
        ],
      });
      continue;
    }

    const blockUnits = estimateBlockUnits(block);

    if (
      currentBlocks.length > 0 &&
      currentUnits + blockUnits > NUTRITION_PAGE_CAPACITY &&
      !canUseFooterBuffer(block, blockUnits)
    ) {
      flushCurrentBlocks();
    }

    currentBlocks.push(block);
    currentUnits += blockUnits;
  }

  flushCurrentBlocks();

  return pages;
}

export function buildNutritionQuestionnairePdfModel(input: {
  patientName: string;
  payload: Record<string, unknown>;
  submittedAt: string;
  reference: string;
}) {
  const payload = input.payload;
  const patientName = asString(payload.name) ?? input.patientName;
  const submittedAtLabel = formatDateTime(input.submittedAt);

  const generalSection = createSection("1. Informații Generale", [
    createFieldGridBlock(
      [
        {
          label: "Nume complet",
          value: patientName,
        },
        {
          label: "Vârstă",
          value: withSuffix(asString(payload.age), "ani") ?? "",
        },
        {
          label: "Data nașterii",
          value: formatDate(asString(payload.birth_date)) ?? "",
        },
        {
          label: "Sex",
          value: normalizeSex(asString(payload.sex)) ?? "",
        },
        {
          label: "Stare civilă",
          value: asString(payload.marital_status) ?? "",
        },
        {
          label: "Copii",
          value: asString(payload.children) ?? "",
        },
        {
          label: "Înălțime",
          value: withSuffix(asString(payload.height), "cm") ?? "",
        },
        {
          label: "Greutate",
          value: withSuffix(asString(payload.weight), "kg") ?? "",
        },
        {
          label: "Greutate ideală",
          value: withSuffix(asString(payload.ideal_weight), "kg") ?? "",
          accent: true,
        },
      ].filter((field): field is NutritionQuestionnairePdfField => Boolean(field.value)),
      3,
    ),
  ]);

  const familyItems = [
    ...asArray(payload["antecedente_familiale[]"]),
    ...asArray(payload.antecedente_altele_descriere),
  ];
  const familySection = createSection("2. Antecedente Familiale", [
    createChecklistGridBlock(
      familyItems.length
        ? [
            {
              title: "Antecedente familiale",
              items: familyItems,
            },
          ]
        : [],
    ),
  ]);

  const menstruationValue = compactJoin([
    asArray(payload["femeie_menstruatie[]"]).join(", "),
    asString(payload.femeie_menstruatie_descriere),
  ]);
  const personalSection = createSection("3. Antecedente Personale", [
    createStatusCardGridBlock(
      [
        createStatusCard(
          asString(payload.interventii_boli)
            ? {
                title: "Intervenții / boli cronice",
                value: buildStatusValue(
                  asString(payload.interventii_boli),
                  "Istoric declarat",
                  "Fără istoric declarat",
                ) ?? "",
                detail: asString(payload.interventii_boli_descriere) ?? undefined,
                tone: buildStatusTone(
                  asString(payload.interventii_boli),
                  "warning",
                  "success",
                ),
                icon: "medical",
              }
            : null,
        ),
        createStatusCard(
          menstruationValue
            ? {
                title: "Menstruație",
                value: asArray(payload["femeie_menstruatie[]"])[0] ?? "Menstruație",
                detail:
                  compactJoin([
                    asArray(payload["femeie_menstruatie[]"]).slice(1).join(", "),
                    asString(payload.femeie_menstruatie_descriere),
                  ]) ?? undefined,
                tone: "neutral",
                icon: "cycle",
              }
            : null,
        ),
      ].filter((card): card is NutritionQuestionnairePdfStatusCard => Boolean(card)),
      2,
    ),
    ...createDetailGridBlocks(
      [
        {
          label:
            "Ati luat sau pierdut in greutate recent? Daca da, explicati modificarile:",
          value: asString(payload.modificari_greutate) ?? "",
        },
      ].filter((entry) => entry.value.length),
      1,
      3,
    ),
  ]);

  const medicationRows = buildParallelRows(payload, [
    { key: "medicamente[]" },
    { key: "medicamente_cantitate[]" },
  ]);
  const supplementRows = buildParallelRows(payload, [
    { key: "suplimente[]" },
    { key: "suplimente_cantitate[]" },
  ]);
  const allergyRows = buildParallelRows(payload, [
    { key: "alergii[]" },
    { key: "alergii_descriere[]" },
  ]);
  const dietRows = buildParallelRows(payload, [
    { key: "diete[]" },
    { key: "diete_descriere[]" },
  ]);
  const practiciReligioaseValue = asString(payload.practici_religioase);
  const religiousPracticeDescription =
    practiciReligioaseValue && !["Da", "Nu"].includes(practiciReligioaseValue)
      ? practiciReligioaseValue
      : null;

  const healthSection = createSection("4. Stare de sănătate", [
    createGaugeGridBlock(
      [
        buildGauge(
          "Nivel de stres",
          asString(payload.stress_level),
        ),
        buildGauge(
          "Nivel Pregatire Schimbare",
          asString(payload.readiness_level),
        ),
      ].filter((gauge): gauge is NutritionQuestionnairePdfGauge => Boolean(gauge)),
    ),
    createStatusCardGridBlock(
      [
        createStatusCard(
          asString(payload.fumati)
            ? {
                title: "Fumat",
                value: buildStatusValue(
                  asString(payload.fumati),
                  "Fumător",
                  "Nefumător",
                ) ?? "",
                detail: asString(payload.fumati_cantitate)
                  ? `${asString(payload.fumati_cantitate)} / zi`
                  : undefined,
                tone: buildStatusTone(asString(payload.fumati), "danger", "success"),
                icon: "smoking",
              }
            : null,
        ),
        createStatusCard(
          asString(payload.alcool)
            ? {
                title: "Consum alcool",
                value: buildStatusValue(
                  asString(payload.alcool),
                  "Consum declarat",
                  "Nu consumă alcool",
                ) ?? "",
                detail: asString(payload.alcool_cantitate) ?? undefined,
                tone: buildStatusTone(asString(payload.alcool), "warning", "success"),
                icon: "alcohol",
              }
            : null,
        ),
        createStatusCard(
          asString(payload.medicamente_radio) || medicationRows.length
            ? {
                title: "Medicamente",
                value: medicationRows.length
                  ? `${medicationRows.length} declarate`
                  : buildStatusValue(
                      asString(payload.medicamente_radio),
                      "Declarate",
                      "Nedeclarate",
                    ) ?? "",
                tone: medicationRows.length ? "warning" : "neutral",
                icon: "medical",
              }
            : null,
        ),
        createStatusCard(
          asString(payload.suplimente_radio) || supplementRows.length
            ? {
                title: "Suplimente",
                value: supplementRows.length
                  ? `${supplementRows.length} declarate`
                  : buildStatusValue(
                      asString(payload.suplimente_radio),
                      "Declarate",
                      "Nedeclarate",
                    ) ?? "",
                tone: supplementRows.length ? "neutral" : "success",
                icon: "supplement",
              }
            : null,
        ),
      ].filter((card): card is NutritionQuestionnairePdfStatusCard => Boolean(card)),
      2,
    ),
    ...createDetailGridBlocks(
      [
        {
          label: "Va rugam sa enumerati eventualele probleme de sanatate actuale:",
          value: asString(payload.probleme_sanatate) ?? "",
        },
        {
          label:
            "Ce obstacole v-ar putea impiedica sa faceti modificari in stilul de viata?",
          value: asString(payload.obstacole) ?? "",
        },
        {
          label:
            "Practici religioase care ar putea influenta dieta sau ingrijirea sanatatii:",
          value: medicationRows.length ? "" : religiousPracticeDescription ?? "",
        },
      ].filter((entry) => entry.value.length),
      1,
      1,
    ),
  ]);

  const religiousPracticeTableIntroBlocks =
    religiousPracticeDescription && medicationRows.length
      ? createDetailGridBlocks(
          [
            {
              label:
                "Practici religioase care ar putea influenta dieta sau ingrijirea sanatatii:",
              value: religiousPracticeDescription,
            },
          ],
          1,
          1,
        )
      : [];
  const religiousPracticeTableIntroHeightMm = religiousPracticeTableIntroBlocks.length
    ? estimateDetailGridHeightMm(
        [
          {
            label:
              "Practici religioase care ar putea influenta dieta sau ingrijirea sanatatii:",
            value: religiousPracticeDescription ?? "",
          },
        ],
        1,
      ) + PDF_SECTION_BODY_BLOCK_GAP_MM
    : 0;

  const medicationTablePages = medicationRows.length
    ? createTableBlocks(
        {
          title: "Medicamente curente",
          columns: ["Nume medicament", "Cantitate"],
          rows: medicationRows,
        },
        {
          firstPageReservedHeightMm: religiousPracticeTableIntroHeightMm,
          continuationSubtitle: "Continuare tabel medicamente",
        },
      )
        .filter(isTableBlock)
        .map((block, index) => ({
          number: 0,
          sections: [
            {
              title: "4. Stare de sănătate",
              contextLabel: "Medicamente curente",
              blocks: [...(index === 0 ? religiousPracticeTableIntroBlocks : []), block],
            },
          ],
        }))
    : [];

  const supplementTableBlocks = createTableBlocks(
    {
      title: "Suplimente curente",
      columns: ["Nume supliment", "Cantitate"],
      rows: supplementRows,
    },
    {
      continuationSubtitle: "Continuare tabel suplimente",
    },
  );
  const supplementTablePages = supplementRows.length
    ? supplementTableBlocks.filter(isTableBlock).map((block) => ({
          number: 0,
          sections: [
            {
              title: "4. Stare de sănătate",
              contextLabel: "Suplimente curente",
              blocks: [block],
            },
          ],
        }))
    : [];

  const activitySection = createSection("5. Activitate fizică", [
    createStatusCardGridBlock(
      [
        createStatusCard(
          asString(payload.activitate_fizica)
            ? {
                title: "Activitate fizică",
                value: buildStatusValue(
                  asString(payload.activitate_fizica),
                  "Activ",
                  "Sedentar",
                ) ?? "",
                detail:
                  asString(payload.activitate_fizica) === "Da"
                    ? compactJoin(
                        [
                          compactJoin([
                            asString(payload.activitate_frecventa),
                            asString(payload.activitate_durata),
                          ]),
                          asString(payload.activitate_descriere),
                        ],
                        "\n",
                      ) || undefined
                    : undefined,
                tone: buildStatusTone(
                  asString(payload.activitate_fizica),
                  "success",
                  "warning",
                ),
                icon: "activity",
              }
            : null,
        ),
      ].filter((card): card is NutritionQuestionnairePdfStatusCard => Boolean(card)),
      1,
    ),
  ]);

  const triggerCard = createChecklistGridBlock(
    asArray(payload["declansatori[]"]).length || asString(payload.declansatori_altele_text)
      ? [
          {
            title: "Ce credeti ca a declansat cresterea in greutate?",
            items: [
              ...asArray(payload["declansatori[]"]),
              ...asArray(payload.declansatori_altele_text),
            ],
          },
        ]
      : [],
  );

  const allergyTableBlocks = createTableBlocks({
      title: "Alergii si intolerante",
      columns: ["Alergie / intoleranță", "Descriere"],
      rows: allergyRows,
    });
  const allergyBlocks =
    allergyTableBlocks.length > 0
      ? allergyTableBlocks
      : createDetailGridBlocks(
          [
            {
              label: "Suferiti de alergii / intolerante alimentare?",
              value: asString(payload.alergii_toggle) ?? "",
            },
          ].filter((entry) => entry.value.length),
          1,
          1,
        );

  const dietTableBlocks = createTableBlocks({
      title: "Istoric diete",
      columns: ["Dietă", "Descriere"],
      rows: dietRows,
    });
  const dietBlocks =
    dietTableBlocks.length > 0
      ? dietTableBlocks
      : createDetailGridBlocks(
          [
            {
              label: "Ati tinut vreodata o dieta?",
              value: asString(payload.diete_toggle) ?? "",
            },
          ].filter((entry) => entry.value.length),
          1,
          1,
        );

  const appetiteAndBehaviorBlock = createStatusCardGridBlock(
    [
      createStatusCard(
        asString(payload.pofta_mancare)
          ? {
              title: "Pofta de mancare",
              value: buildStatusValue(
                asString(payload.pofta_mancare),
                "Schimbare declarata",
                "Fara schimbari",
              ) ?? "",
              detail: asString(payload.pofta_mancare_explicatii) ?? undefined,
              tone: buildStatusTone(
                asString(payload.pofta_mancare),
                "warning",
                "success",
              ),
              icon: "appetite",
            }
          : null,
      ),
      createStatusCard(
        asString(payload.laxative)
          ? {
              title: "Laxative / post / exercitii excesive",
              value: buildStatusValue(
                asString(payload.laxative),
                "Da",
                "Nu",
              ) ?? "",
              detail: asString(payload.laxative_explicatii) ?? undefined,
              tone: buildStatusTone(
                asString(payload.laxative),
                "danger",
                "success",
              ),
              icon: "care",
            }
          : null,
      ),
    ].filter((card): card is NutritionQuestionnairePdfStatusCard => Boolean(card)),
    2,
  );

  const nutritionBlocks = [
    createStatusCardGridBlock(
      [
        createStatusCard(
          asString(payload.alergii_toggle) || allergyRows.length
            ? {
                title: "Alergii si intolerante",
                value: allergyRows.length
                  ? `${allergyRows.length} declarate`
                  : buildStatusValue(
                      asString(payload.alergii_toggle),
                      "Declarate",
                      "Nedeclarate",
                    ) ?? "",
                tone: allergyRows.length > 0 ? "danger" : "success",
                icon: "care",
              }
            : null,
        ),
        createStatusCard(
          asString(payload.diete_toggle) || dietRows.length
            ? {
                title: "Istoric diete",
                value: dietRows.length
                  ? `${dietRows.length} declarate`
                  : buildStatusValue(
                      asString(payload.diete_toggle),
                      "Declarat",
                      "Nedeclarat",
                    ) ?? "",
                tone: dietRows.length > 0 ? "warning" : "success",
                icon: "care",
              }
            : null,
        ),
        createStatusCard(
          false && asString(payload.pofta_mancare)
            ? {
                title: "Pofta de mâncare",
                value: buildStatusValue(
                  asString(payload.pofta_mancare),
                  "Schimbare declarată",
                  "Fără schimbări",
                ) ?? "",
                detail: asString(payload.pofta_mancare_explicatii) ?? undefined,
                tone: buildStatusTone(
                  asString(payload.pofta_mancare),
                  "warning",
                  "success",
                ),
                icon: "appetite",
              }
            : null,
        ),
        createStatusCard(
          allergyRows.length < 0 && (asString(payload.alergii_toggle) || buildParallelRows(payload, [
            { key: "alergii[]" },
            { key: "alergii_descriere[]" },
          ]).length)
            ? {
                title: "Alergii / intoleranțe",
                value: buildParallelRows(payload, [
                  { key: "alergii[]" },
                  { key: "alergii_descriere[]" },
                ]).length
                  ? `${buildParallelRows(payload, [
                      { key: "alergii[]" },
                      { key: "alergii_descriere[]" },
                    ]).length} declarate`
                  : buildStatusValue(
                      asString(payload.alergii_toggle),
                      "Da",
                      "Nu",
                    ) ?? "",
                tone:
                  buildParallelRows(payload, [
                    { key: "alergii[]" },
                    { key: "alergii_descriere[]" },
                  ]).length > 0
                    ? "danger"
                    : "success",
                icon: "care",
              }
            : null,
        ),
        createStatusCard(
          dietRows.length < 0 && (asString(payload.diete_toggle) || buildParallelRows(payload, [
            { key: "diete[]" },
            { key: "diete_descriere[]" },
          ]).length)
            ? {
                title: "Dietă anterioară",
                value: buildParallelRows(payload, [
                  { key: "diete[]" },
                  { key: "diete_descriere[]" },
                ]).length
                  ? `${buildParallelRows(payload, [
                      { key: "diete[]" },
                      { key: "diete_descriere[]" },
                    ]).length} dietă${buildParallelRows(payload, [
                      { key: "diete[]" },
                      { key: "diete_descriere[]" },
                    ]).length === 1 ? "" : "e"}`
                  : buildStatusValue(
                      asString(payload.diete_toggle),
                      "Da",
                      "Nu",
                    ) ?? "",
                tone:
                  buildParallelRows(payload, [
                    { key: "diete[]" },
                    { key: "diete_descriere[]" },
                  ]).length > 0
                    ? "warning"
                    : "success",
                icon: "care",
              }
            : null,
        ),
        createStatusCard(
          false && asString(payload.laxative)
            ? {
                title: "Laxative / post / exerciții excesive",
                value: buildStatusValue(
                  asString(payload.laxative),
                  "Da",
                  "Nu",
                ) ?? "",
                detail: asString(payload.laxative_explicatii) ?? undefined,
                tone: buildStatusTone(
                  asString(payload.laxative),
                  "danger",
                  "success",
                ),
                icon: "care",
              }
            : null,
        ),
      ].filter((card): card is NutritionQuestionnairePdfStatusCard => Boolean(card)),
      2,
    ),
    appetiteAndBehaviorBlock,
    ...createDetailGridBlocks(
      [
        {
          label: "Ce doriti sa schimbati in privinta obiceiurilor alimentare?",
          value: asString(payload.obiective_alimentare) ?? "",
        },
        {
          label: "Cat de des mancati in oras / fast-food?",
          value: asString(payload.fastfood_frecventa) ?? "",
        },
      ].filter((entry) => entry.value.length),
      2,
      4,
    ),
    ...allergyBlocks,
    ...dietBlocks,
    ...createDetailGridBlocks(
      [
        {
          label: "Programul meselor",
          value:
            compactJoin([
              asString(payload.ora_mic_dejun)
                ? `Mic dejun: ${asString(payload.ora_mic_dejun)}`
                : null,
              asString(payload.ora_pranz)
                ? `Prânz: ${asString(payload.ora_pranz)}`
                : null,
              asString(payload.ora_cina)
                ? `Cină: ${asString(payload.ora_cina)}`
                : null,
              asString(payload.ora_gustari)
                ? `Gustări: ${asString(payload.ora_gustari)}`
                : null,
            ]) ?? "",
        },
        {
          label: "Fluctuatii majore de greutate in ultimii 5-10 ani",
          value: asString(payload.fluctuatii_greutate) ?? "",
        },
        {
          label: "Cate mese mancati pe zi? / Care sunt mesele?",
          value:
            compactJoin([
              asString(payload.mese_pe_zi)
                ? `${asString(payload.mese_pe_zi)} mese / zi`
                : null,
              asString(payload.mese_descriere),
            ]) ?? "",
        },
        {
          label: "Ce tip de paine consumati si in ce cantitate?",
          value: asString(payload.paine) ?? "",
        },
      ].filter((entry) => entry.value.length),
      2,
      4,
    ),
    triggerCard,
    ...createTableBlocks({
      title: "Alimente consumate frecvent",
      columns: ["Nume aliment"],
      rows: buildParallelRows(payload, [{ key: "alimenteConsumate[]" }]),
      compact: true,
    }),
    createInfoCardGridBlock(buildNutritionCards(payload)),
    ...createDetailGridBlocks(
      [
        {
          label: "Cat de des consumati alcool (1-2 pahare la o masa)?",
          value: asString(payload.alcool_frecventa) ?? "",
        },
      ].filter((entry) => entry.value.length),
      1,
      1,
    ),
    ...createTableBlocks({
      title: "Alimente neagreate",
      columns: ["Aliment"],
      rows: buildParallelRows(payload, [{ key: "displaceri[]" }]),
      compact: true,
    }),
    ...createTableBlocks({
      title: "Alimentatie ultimele 2 zile",
      columns: ["Zi", "Produs / Aliment", "Cantitate", "Ora"],
      rows: buildParallelRows(payload, [
        { key: "alimentatie_zi[]" },
        { key: "alimentatie_produs[]" },
        { key: "alimentatie_cantitate[]" },
        { key: "alimentatie_ora[]" },
      ]),
    }),
  ].filter((block): block is NutritionQuestionnairePdfBlock => Boolean(block));

  const pages: NutritionQuestionnairePdfPage[] = [];

  if (generalSection || familySection) {
    pages.push({
      number: pages.length + 1,
      sections: [generalSection, familySection].filter(
        (section): section is NutritionQuestionnairePdfSection => Boolean(section),
      ),
    });
  }

  if (personalSection) {
    pages.push({
      number: pages.length + 1,
      sections: [personalSection],
    });
  }

  if (healthSection) {
    pages.push({
      number: pages.length + 1,
      sections: [healthSection],
    });
  }

  for (const page of [...medicationTablePages, ...supplementTablePages]) {
    pages.push({
      ...page,
      number: pages.length + 1,
    });
  }

  const nutritionPages = paginateNutritionSection(
    "6. Informații nutriționale",
    nutritionBlocks,
    pages.length + 1,
  );
  if (activitySection) {
    const [firstNutritionPage, ...remainingNutritionPages] = nutritionPages;

    pages.push({
      number: pages.length + 1,
      sections: [
        activitySection,
        ...(firstNutritionPage?.sections ?? []),
      ],
    });

    pages.push(
      ...remainingNutritionPages.map((page, index) => ({
        ...page,
        number: pages.length + index + 1,
      })),
    );
  } else {
    pages.push(...nutritionPages);
  }

  return {
    patientName,
    submittedAtLabel,
    headerMeta: `Chestionar completat • ${submittedAtLabel}`,
    footerReference: input.reference,
    footerLabel: "Document clinic confidențial.",
    pages,
  };
}

function clonePdfBlock(block: NutritionQuestionnairePdfBlock) {
  return JSON.parse(JSON.stringify(block)) as NutritionQuestionnairePdfBlock;
}

function normalizeSemanticBlock(block: NutritionQuestionnairePdfBlock) {
  const clonedBlock = clonePdfBlock(block);

  if (
    clonedBlock.kind === "table" &&
    clonedBlock.table.subtitle?.toLocaleLowerCase("ro-RO").startsWith("continuare")
  ) {
    return {
      ...clonedBlock,
      table: {
        ...clonedBlock.table,
        subtitle: undefined,
      },
    } satisfies NutritionQuestionnairePdfBlock;
  }

  return clonedBlock;
}

function hasSameTableSignature(
  first: NutritionQuestionnairePdfTable,
  second: NutritionQuestionnairePdfTable,
) {
  return (
    first.title === second.title &&
    first.compact === second.compact &&
    first.columns.length === second.columns.length &&
    first.columns.every((column, index) => column === second.columns[index])
  );
}

function appendSemanticBlock(
  section: NutritionQuestionnairePdfSection,
  block: NutritionQuestionnairePdfBlock,
) {
  const previousBlock = section.blocks.at(-1);

  if (
    previousBlock?.kind === "table" &&
    block.kind === "table" &&
    hasSameTableSignature(previousBlock.table, block.table)
  ) {
    previousBlock.table.rows = [...previousBlock.table.rows, ...block.table.rows];
    return;
  }

  section.blocks.push(block);
}

function getSemanticSectionContext(section: NutritionQuestionnairePdfSection) {
  const tableTitles = new Set(
    section.blocks
      .filter(isTableBlock)
      .map((block) => block.table.title),
  );

  return section.contextLabel && !tableTitles.has(section.contextLabel)
    ? section.contextLabel
    : undefined;
}

function unpaginateNutritionQuestionnairePdfModel(
  model: NutritionQuestionnairePdfModel,
) {
  const sections: NutritionQuestionnairePdfSection[] = [];

  for (const page of model.pages) {
    for (const section of page.sections) {
      const contextLabel = getSemanticSectionContext(section);
      const currentSection = sections.at(-1);
      const targetSection =
        currentSection?.title === section.title &&
        currentSection.contextLabel === contextLabel
          ? currentSection
          : {
              title: section.title,
              contextLabel,
              blocks: [],
            };

      if (targetSection !== currentSection) {
        sections.push(targetSection);
      }

      for (const block of section.blocks) {
        appendSemanticBlock(targetSection, normalizeSemanticBlock(block));
      }
    }
  }

  return {
    patientName: model.patientName,
    submittedAtLabel: model.submittedAtLabel,
    headerMeta: model.headerMeta,
    footerReference: model.footerReference,
    footerLabel: model.footerLabel,
    sections,
  } satisfies NutritionQuestionnairePdfDocumentModel;
}

export function buildNutritionQuestionnairePdfDocumentModel(input: {
  patientName: string;
  payload: Record<string, unknown>;
  submittedAt: string;
  reference: string;
}) {
  return unpaginateNutritionQuestionnairePdfModel(
    buildNutritionQuestionnairePdfModel(input),
  );
}
