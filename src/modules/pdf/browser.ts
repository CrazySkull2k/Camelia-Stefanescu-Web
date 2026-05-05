import "server-only";

import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { platform } from "node:os";

import { getPdfEnv } from "@/lib/env/server";

const WINDOWS_BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const LINUX_BROWSER_CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/snap/bin/chromium",
];

async function fileExists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveChromiumExecutablePath() {
  const { PDF_CHROMIUM_EXECUTABLE_PATH } = getPdfEnv();
  const envCandidates = [
    PDF_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of envCandidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  const osCandidates =
    platform() === "win32"
      ? WINDOWS_BROWSER_CANDIDATES
      : LINUX_BROWSER_CANDIDATES;

  for (const candidate of osCandidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function renderHtmlToPdf(html: string) {
  const executablePath = await resolveChromiumExecutablePath();

  if (!executablePath) {
    throw new Error(
      "Nu am gasit un executabil Chromium/Chrome pentru generarea PDF. Configureaza PDF_CHROMIUM_EXECUTABLE_PATH pe server.",
    );
  }

  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu", "--font-render-hinting=none", "--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });

    return await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

export type QuestionnairePdfTableMeasurements = {
  fixedHeight: number;
  rowHeights: number[];
};

export type QuestionnairePdfLayoutMeasurements = {
  blocks: Record<string, number>;
  pageContentHeight: number;
  pageSectionGap: number;
  sectionBodyGap: number;
  sectionHeadingBodyGap: number;
  sectionHeadings: Record<string, number>;
  tables: Record<string, QuestionnairePdfTableMeasurements>;
};

export async function measureQuestionnairePdfLayout(html: string) {
  const executablePath = await resolveChromiumExecutablePath();

  if (!executablePath) {
    throw new Error(
      "Nu am gasit un executabil Chromium/Chrome pentru masurarea PDF. Configureaza PDF_CHROMIUM_EXECUTABLE_PATH pe server.",
    );
  }

  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu", "--font-render-hinting=none", "--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });

    return await page.evaluate(() => {
      function toPixelNumber(value: string) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function getElementHeight(element: Element | null) {
        return element instanceof HTMLElement
          ? element.getBoundingClientRect().height
          : 0;
      }

      const pageContent = document.querySelector<HTMLElement>(
        "[data-measure-page-content]",
      );
      const sectionGapProbe = document.querySelector<HTMLElement>(
        "[data-measure-section-gap-probe]",
      );
      const blockGapProbe = document.querySelector<HTMLElement>(
        "[data-measure-block-gap-probe]",
      );
      const sectionHeadings: Record<string, number> = {};
      const blocks: Record<string, number> = {};
      const tables: Record<
        string,
        { fixedHeight: number; rowHeights: number[] }
      > = {};

      document
        .querySelectorAll<HTMLElement>("[data-measure-section-heading-id]")
        .forEach((element) => {
          const id = element.dataset.measureSectionHeadingId;

          if (id) {
            sectionHeadings[id] = element.getBoundingClientRect().height;
          }
        });

      document
        .querySelectorAll<HTMLElement>("[data-measure-block-id]")
        .forEach((element) => {
          const id = element.dataset.measureBlockId;

          if (id) {
            blocks[id] = element.getBoundingClientRect().height;
          }
        });

      document
        .querySelectorAll<HTMLElement>("[data-measure-table-id]")
        .forEach((element) => {
          const id = element.dataset.measureTableId;

          if (!id) {
            return;
          }

          const rowHeights = Array.from(
            element.querySelectorAll<HTMLElement>("tbody tr"),
          ).map((row) => row.getBoundingClientRect().height);
          const rowHeightTotal = rowHeights.reduce(
            (total, height) => total + height,
            0,
          );

          tables[id] = {
            fixedHeight: Math.max(
              0,
              element.getBoundingClientRect().height - rowHeightTotal,
            ),
            rowHeights,
          };
        });

      return {
        blocks,
        pageContentHeight: Math.max(0, getElementHeight(pageContent) - 2),
        pageSectionGap: toPixelNumber(
          getComputedStyle(pageContent ?? document.body).rowGap,
        ),
        sectionBodyGap: toPixelNumber(
          getComputedStyle(blockGapProbe ?? document.body).rowGap,
        ),
        sectionHeadingBodyGap: toPixelNumber(
          getComputedStyle(sectionGapProbe ?? document.body).rowGap,
        ),
        sectionHeadings,
        tables,
      } satisfies QuestionnairePdfLayoutMeasurements;
    });
  } finally {
    await browser.close();
  }
}
