import "server-only";

import { cache } from "react";

import { resolvePublicMediaUrl } from "@/lib/media";
import { readLegacyFile } from "@/lib/utils/legacy";
import { slugify } from "@/lib/utils/slug";
import type { BlogCategory, BlogPost } from "@/modules/blog/types";

function extractInsertBlock(sql: string, tableName: string) {
  const expression = new RegExp(
    `INSERT INTO \\\`${tableName}\\\` \\([\\s\\S]*?\\) VALUES([\\s\\S]*?);`,
    "i",
  );
  const match = sql.match(expression);
  return match?.[1] ?? "";
}

function parseValueTuples(block: string) {
  const rows: Array<Array<string | null>> = [];
  let row: Array<string | null> = [];
  let current = "";
  let inString = false;
  let inRow = false;

  for (let index = 0; index < block.length; index += 1) {
    const char = block[index];
    const next = block[index + 1];

    if (!inRow) {
      if (char === "(") {
        inRow = true;
        row = [];
        current = "";
      }
      continue;
    }

    if (inString) {
      if (char === "\\") {
        current += next ?? "";
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = false;
        continue;
      }

      current += char;
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === ",") {
      row.push(current.trim().toUpperCase() === "NULL" ? null : current.trim());
      current = "";
      continue;
    }

    if (char === ")") {
      row.push(current.trim().toUpperCase() === "NULL" ? null : current.trim());
      rows.push(row);
      row = [];
      current = "";
      inRow = false;
      continue;
    }

    current += char;
  }

  return rows;
}

function normalizeImagePath(image?: string | null) {
  if (!image) {
    return null;
  }

  if (image.startsWith("assets/")) {
    return null;
  }

  return resolvePublicMediaUrl(image);
}

async function parseLegacyBlogData() {
  const sql = await readLegacyFile("migration_sql/data_for_migration.sql");
  const categoryRows = parseValueTuples(extractInsertBlock(sql, "categories"));
  const postRows = parseValueTuples(extractInsertBlock(sql, "posts"));

  const categories: BlogCategory[] = categoryRows.map((row) => ({
    id: String(row[0]),
    name: String(row[1] ?? ""),
    slug: slugify(String(row[1] ?? "")),
  }));

  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  const posts: BlogPost[] = postRows.map((row) => ({
    id: String(row[0]),
    title: String(row[1] ?? ""),
    slug: String(row[2] ?? ""),
    image: normalizeImagePath(row[3]),
    categoryId: row[4] ? String(row[4]) : null,
    categoryName: row[4] ? categoryMap.get(String(row[4])) ?? null : null,
    contentHtml: String(row[5] ?? ""),
    excerpt: row[6] ? String(row[6]) : null,
    createdAt: String(row[7] ?? new Date().toISOString()),
  }));

  return {
    categories,
    posts,
  };
}

export const getLegacyBlogData = cache(parseLegacyBlogData);
