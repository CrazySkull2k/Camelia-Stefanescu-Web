import { readFile } from "node:fs/promises";

import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

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

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function main() {
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const sql = await readFile("migration_sql/data_for_migration.sql", "utf8");
  const categoryRows = parseValueTuples(extractInsertBlock(sql, "categories"));
  const postRows = parseValueTuples(extractInsertBlock(sql, "posts"));

  for (const row of categoryRows) {
    const id = String(row[0]);
    const name = String(row[1] ?? "");
    await supabase.from("blog_categories").upsert({
      id,
      name,
      slug: slugify(name),
    }, { onConflict: "id" });
  }

  for (const row of postRows) {
    await supabase.from("blog_posts").upsert({
      slug: String(row[2]),
      title: String(row[1] ?? ""),
      excerpt: row[6] ? String(row[6]) : null,
      category_id: row[4] ? String(row[4]) : null,
      cover_image_path: row[3] ? `/legacy/${String(row[3])}` : null,
      content_json: { type: "html", html: String(row[5] ?? "") },
      content_html: String(row[5] ?? ""),
      status: "published",
      published_at: row[7] ? new Date(String(row[7])).toISOString() : new Date().toISOString(),
    }, { onConflict: "slug" });
  }

  console.log(`Imported ${categoryRows.length} blog categories and ${postRows.length} posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
