import type {
  NutritionQuestionnairePdfDocumentModel,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";
import {
  getQuestionnaireBlockMeasureId,
  getQuestionnaireSectionHeadingMeasureId,
  getQuestionnaireTableHeadingMeasureId,
} from "@/modules/pdf/nutrition-questionnaire-pagination-ids";

import {
  PdfBlock,
  PdfPageFooter,
  PdfPageHeader,
  SectionHeading,
  nutritionQuestionnaireTemplateStyles,
} from "./nutrition-questionnaire-template";

type NutritionQuestionnaireMeasurementTemplateProps = {
  fontFacesCss: string;
  model: NutritionQuestionnairePdfDocumentModel;
};

const measurementStyles = `
  .measurement-root {
    left: -10000px;
    position: absolute;
    top: 0;
    visibility: hidden;
    width: 210mm;
  }

  .measurement-root .sheet {
    break-after: auto;
    margin: 0;
    page-break-after: auto;
  }

  .measurement-card {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .measurement-content {
    flex: none;
    overflow: visible;
  }

  .measurement-item {
    width: 100%;
  }
`;

export function NutritionQuestionnaireMeasurementTemplate({
  fontFacesCss,
  model,
}: NutritionQuestionnaireMeasurementTemplateProps) {
  const styles = `${nutritionQuestionnaireTemplateStyles.replace(
    "__FONT_FACES__",
    fontFacesCss,
  )}\n${measurementStyles}`;

  return (
    <html className="light" lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Masurare chestionar nutritional</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <main className="measurement-root">
          <section className="sheet">
            <div className="page-card">
              <PdfPageHeader headerMeta={model.headerMeta} />
              <div className="page-content" data-measure-page-content />
              <PdfPageFooter
                footerLabel={model.footerLabel}
                footerReference={model.footerReference}
                pageCount={1}
                pageNumber={1}
              />
            </div>
          </section>

          <section className="sheet">
            <div className="measurement-card page-card">
              <div className="measurement-content page-content">
                <section className="pdf-section" data-measure-section-gap-probe>
                  <div />
                  <div className="pdf-section-body" data-measure-block-gap-probe>
                    <div />
                    <div />
                  </div>
                </section>

                {model.sections.map((section, sectionIndex) => (
                  <div
                    className="measurement-item"
                    data-measure-section-heading-id={getQuestionnaireSectionHeadingMeasureId(
                      sectionIndex,
                    )}
                    key={`section-heading-${sectionIndex}`}
                  >
                    <SectionHeading
                      contextLabel={section.contextLabel}
                      title={section.title}
                    />
                  </div>
                ))}

                {model.sections.flatMap((section, sectionIndex) =>
                  section.blocks.flatMap((block, blockIndex) => {
                    const blockId = getQuestionnaireBlockMeasureId(
                      sectionIndex,
                      blockIndex,
                    );

                    if (block.kind === "table") {
                      return [
                        <div
                          className="measurement-item"
                          data-measure-section-heading-id={getQuestionnaireTableHeadingMeasureId(
                            sectionIndex,
                            blockIndex,
                          )}
                          key={`table-heading-${blockId}`}
                        >
                          <SectionHeading
                            contextLabel={block.table.title}
                            title={section.title}
                          />
                        </div>,
                        <div
                          className="measurement-item"
                          data-measure-table-id={blockId}
                          key={`table-${blockId}`}
                        >
                          <PdfBlock block={block} hideTableTitle />
                        </div>,
                      ];
                    }

                    return [
                      <div
                        className="measurement-item"
                        data-measure-block-id={blockId}
                        key={`block-${blockId}`}
                      >
                        <PdfBlock block={block} />
                      </div>,
                    ];
                  }),
                )}
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
