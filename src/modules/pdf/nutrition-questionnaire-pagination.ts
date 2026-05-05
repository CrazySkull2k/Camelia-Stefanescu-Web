import "server-only";

import type {
  QuestionnairePdfLayoutMeasurements,
  QuestionnairePdfTableMeasurements,
} from "@/modules/pdf/browser";
import type {
  NutritionQuestionnairePdfBlock,
  NutritionQuestionnairePdfDocumentModel,
  NutritionQuestionnairePdfModel,
  NutritionQuestionnairePdfSection,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";
import {
  getQuestionnaireBlockMeasureId,
  getQuestionnaireSectionHeadingMeasureId,
  getQuestionnaireTableHeadingMeasureId,
} from "@/modules/pdf/nutrition-questionnaire-pagination-ids";

type PageDraft = {
  sections: NutritionQuestionnairePdfSection[];
  usedHeight: number;
};

function clonePdfBlock(block: NutritionQuestionnairePdfBlock) {
  return JSON.parse(JSON.stringify(block)) as NutritionQuestionnairePdfBlock;
}

function getCurrentPage(pages: PageDraft[]) {
  return pages[pages.length - 1];
}

function createPageDraft(): PageDraft {
  return {
    sections: [],
    usedHeight: 0,
  };
}

function canFit(page: PageDraft, addedHeight: number, pageContentHeight: number) {
  return page.usedHeight + addedHeight <= pageContentHeight;
}

function getNewSectionGap(
  page: PageDraft,
  measurements: QuestionnairePdfLayoutMeasurements,
) {
  return page.sections.length ? measurements.pageSectionGap : 0;
}

function getLastAppendableSection(
  page: PageDraft,
  section: NutritionQuestionnairePdfSection,
) {
  const lastSection = page.sections.at(-1);

  if (
    lastSection?.title === section.title &&
    lastSection.contextLabel === section.contextLabel
  ) {
    return lastSection;
  }

  return null;
}

function getMeasuredHeight(
  values: Record<string, number>,
  id: string,
  fallback = 0,
) {
  const measuredHeight = values[id];
  return Number.isFinite(measuredHeight) && measuredHeight > 0
    ? measuredHeight
    : fallback;
}

function startNewPage(pages: PageDraft[]) {
  const currentPage = getCurrentPage(pages);

  if (currentPage.sections.length) {
    pages.push(createPageDraft());
  }

  return getCurrentPage(pages);
}

function addAtomicBlock(input: {
  block: NutritionQuestionnairePdfBlock;
  blockHeight: number;
  headingHeight: number;
  measurements: QuestionnairePdfLayoutMeasurements;
  pages: PageDraft[];
  section: NutritionQuestionnairePdfSection;
}) {
  const { block, blockHeight, headingHeight, measurements, pages, section } = input;
  let page = getCurrentPage(pages);
  const appendableSection = getLastAppendableSection(page, section);

  if (appendableSection) {
    const addedHeight = measurements.sectionBodyGap + blockHeight;

    if (canFit(page, addedHeight, measurements.pageContentHeight)) {
      appendableSection.blocks.push(clonePdfBlock(block));
      page.usedHeight += addedHeight;
      return;
    }

    page = startNewPage(pages);
  }

  const sectionHeight =
    headingHeight + measurements.sectionHeadingBodyGap + blockHeight;
  let addedHeight = getNewSectionGap(page, measurements) + sectionHeight;

  if (
    !canFit(page, addedHeight, measurements.pageContentHeight) &&
    page.sections.length
  ) {
    page = startNewPage(pages);
    addedHeight = sectionHeight;
  }

  page.sections.push({
    title: section.title,
    contextLabel: section.contextLabel,
    blocks: [clonePdfBlock(block)],
  });
  page.usedHeight += addedHeight;
}

function getTableRowHeights(
  tableMeasurements: QuestionnairePdfTableMeasurements | undefined,
  rowCount: number,
) {
  if (!tableMeasurements?.rowHeights.length) {
    return Array.from({ length: rowCount }, () => 48);
  }

  return Array.from({ length: rowCount }, (_, index) => {
    const measuredHeight = tableMeasurements.rowHeights[index];
    return Number.isFinite(measuredHeight) && measuredHeight > 0
      ? measuredHeight
      : Math.max(...tableMeasurements.rowHeights);
  });
}

function buildTableChunkBlock(input: {
  block: Extract<NutritionQuestionnairePdfBlock, { kind: "table" }>;
  isFirstChunk: boolean;
  rows: string[][];
}) {
  return {
    kind: "table",
    table: {
      ...input.block.table,
      rows: input.rows,
      subtitle: input.isFirstChunk ? input.block.table.subtitle : undefined,
    },
  } satisfies NutritionQuestionnairePdfBlock;
}

function addTableBlock(input: {
  block: Extract<NutritionQuestionnairePdfBlock, { kind: "table" }>;
  blockIndex: number;
  measurements: QuestionnairePdfLayoutMeasurements;
  pages: PageDraft[];
  section: NutritionQuestionnairePdfSection;
  sectionIndex: number;
}) {
  const {
    block,
    blockIndex,
    measurements,
    pages,
    section,
    sectionIndex,
  } = input;
  const tableId = getQuestionnaireBlockMeasureId(sectionIndex, blockIndex);
  const tableMeasurements = measurements.tables[tableId];
  const fixedTableHeight = tableMeasurements?.fixedHeight ?? 48;
  const rowHeights = getTableRowHeights(
    tableMeasurements,
    block.table.rows.length,
  );
  const headingHeight = getMeasuredHeight(
    measurements.sectionHeadings,
    getQuestionnaireTableHeadingMeasureId(sectionIndex, blockIndex),
    getMeasuredHeight(
      measurements.sectionHeadings,
      getQuestionnaireSectionHeadingMeasureId(sectionIndex),
      32,
    ),
  );
  let rowIndex = 0;
  let isFirstChunk = true;

  while (rowIndex < block.table.rows.length) {
    let page = getCurrentPage(pages);
    let chunkHeight = fixedTableHeight;
    const chunkRows: string[][] = [];

    while (rowIndex + chunkRows.length < block.table.rows.length) {
      const nextRowIndex = rowIndex + chunkRows.length;
      const nextRowHeight = rowHeights[nextRowIndex] ?? 48;
      const nextSectionHeight =
        headingHeight +
        measurements.sectionHeadingBodyGap +
        chunkHeight +
        nextRowHeight;
      const nextAddedHeight =
        getNewSectionGap(page, measurements) + nextSectionHeight;

      if (
        !chunkRows.length &&
        !canFit(page, nextAddedHeight, measurements.pageContentHeight) &&
        page.sections.length
      ) {
        page = startNewPage(pages);
        continue;
      }

      if (
        chunkRows.length &&
        !canFit(page, nextAddedHeight, measurements.pageContentHeight)
      ) {
        break;
      }

      chunkRows.push(block.table.rows[nextRowIndex] ?? []);
      chunkHeight += nextRowHeight;
    }

    if (!chunkRows.length) {
      chunkRows.push(block.table.rows[rowIndex] ?? []);
      chunkHeight += rowHeights[rowIndex] ?? 48;
    }

    const sectionHeight =
      headingHeight + measurements.sectionHeadingBodyGap + chunkHeight;
    let addedHeight = getNewSectionGap(page, measurements) + sectionHeight;

    if (
      !canFit(page, addedHeight, measurements.pageContentHeight) &&
      page.sections.length
    ) {
      page = startNewPage(pages);
      addedHeight = sectionHeight;
    }

    page.sections.push({
      title: section.title,
      contextLabel: block.table.title,
      blocks: [
        buildTableChunkBlock({
          block,
          isFirstChunk,
          rows: chunkRows,
        }),
      ],
    });
    page.usedHeight += addedHeight;
    rowIndex += chunkRows.length;
    isFirstChunk = false;
  }
}

export function paginateNutritionQuestionnairePdfDocument(
  documentModel: NutritionQuestionnairePdfDocumentModel,
  measurements: QuestionnairePdfLayoutMeasurements,
) {
  const pages: PageDraft[] = [createPageDraft()];

  documentModel.sections.forEach((section, sectionIndex) => {
    const headingHeight = getMeasuredHeight(
      measurements.sectionHeadings,
      getQuestionnaireSectionHeadingMeasureId(sectionIndex),
      32,
    );

    section.blocks.forEach((block, blockIndex) => {
      if (block.kind === "table") {
        addTableBlock({
          block,
          blockIndex,
          measurements,
          pages,
          section,
          sectionIndex,
        });
        return;
      }

      addAtomicBlock({
        block,
        blockHeight: getMeasuredHeight(
          measurements.blocks,
          getQuestionnaireBlockMeasureId(sectionIndex, blockIndex),
          48,
        ),
        headingHeight,
        measurements,
        pages,
        section,
      });
    });
  });

  const populatedPages = pages.filter((page) => page.sections.length);

  return {
    patientName: documentModel.patientName,
    submittedAtLabel: documentModel.submittedAtLabel,
    headerMeta: documentModel.headerMeta,
    footerReference: documentModel.footerReference,
    footerLabel: documentModel.footerLabel,
    pages: populatedPages.map((page, index) => ({
      number: index + 1,
      sections: page.sections,
    })),
  } satisfies NutritionQuestionnairePdfModel;
}
