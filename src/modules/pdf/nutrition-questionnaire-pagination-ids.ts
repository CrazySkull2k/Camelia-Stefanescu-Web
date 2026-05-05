export function getQuestionnaireSectionHeadingMeasureId(sectionIndex: number) {
  return `section-${sectionIndex}`;
}

export function getQuestionnaireTableHeadingMeasureId(
  sectionIndex: number,
  blockIndex: number,
) {
  return `section-${sectionIndex}-table-${blockIndex}`;
}

export function getQuestionnaireBlockMeasureId(
  sectionIndex: number,
  blockIndex: number,
) {
  return `section-${sectionIndex}-block-${blockIndex}`;
}
