import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SqlValue = string | null;
type BlogCategoryImport = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

const DEFAULT_SQL_PATH = "migration_sql/data_for_migration.sql";

const WINDOWS_1252_REVERSE = new Map<string, number>([
  ["€", 0x80],
  ["‚", 0x82],
  ["ƒ", 0x83],
  ["„", 0x84],
  ["…", 0x85],
  ["†", 0x86],
  ["‡", 0x87],
  ["ˆ", 0x88],
  ["‰", 0x89],
  ["Š", 0x8a],
  ["‹", 0x8b],
  ["Œ", 0x8c],
  ["Ž", 0x8e],
  ["‘", 0x91],
  ["’", 0x92],
  ["“", 0x93],
  ["”", 0x94],
  ["•", 0x95],
  ["–", 0x96],
  ["—", 0x97],
  ["˜", 0x98],
  ["™", 0x99],
  ["š", 0x9a],
  ["›", 0x9b],
  ["œ", 0x9c],
  ["ž", 0x9e],
  ["Ÿ", 0x9f],
]);

function loadDotenv() {
  const envPath = resolve(".env");
  if (!existsSync(envPath)) {
    return;
  }

  const file = readFileSync(envPath, "utf8");
  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function extractInsertBlocks(sql: string, tableName: string) {
  const expression = new RegExp(
    `INSERT INTO\\s+\`${tableName}\`\\s+(?:\\([^)]*\\)\\s+)?VALUES\\s*`,
    "gi",
  );
  const blocks: string[] = [];

  for (const match of sql.matchAll(expression)) {
    const start = match.index + match[0].length;
    const end = findStatementEnd(sql, start);
    blocks.push(sql.slice(start, end));
  }

  return blocks;
}

function findStatementEnd(sql: string, start: number) {
  let inString = false;

  for (let index = start; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (inString) {
      if (char === "\\" && next) {
        index += 1;
        continue;
      }

      if (char === "'") {
        inString = false;
      }

      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === ";") {
      return index;
    }
  }

  return sql.length;
}

function unescapeMysqlString(input: string) {
  return input.replace(/\\([0'"bnrtZ\\%_])/g, (_match, escaped: string) => {
    switch (escaped) {
      case "0":
        return "\0";
      case "'":
        return "'";
      case '"':
        return '"';
      case "b":
        return "\b";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "Z":
        return "\x1a";
      case "\\":
        return "\\";
      case "%":
        return "%";
      case "_":
        return "_";
      default:
        return escaped;
    }
  });
}

function parseValueTuples(block: string) {
  const rows: SqlValue[][] = [];
  let row: SqlValue[] = [];
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
      if (char === "\\" && next) {
        current += char;
        current += next;
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
      row.push(parseSqlValue(current));
      current = "";
      continue;
    }

    if (char === ")") {
      row.push(parseSqlValue(current));
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

function parseSqlValue(value: string): SqlValue {
  const trimmed = value.trim();
  if (trimmed.toUpperCase() === "NULL") {
    return null;
  }

  return fixMojibake(unescapeMysqlString(trimmed));
}

function encodeWindows1252(input: string) {
  const bytes: number[] = [];

  for (const char of input) {
    const code = char.codePointAt(0);
    if (code === undefined) {
      continue;
    }

    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }

    const mapped = WINDOWS_1252_REVERSE.get(char);
    if (mapped === undefined) {
      return null;
    }

    bytes.push(mapped);
  }

  return Buffer.from(bytes);
}

function mojibakeScore(input: string) {
  const matches = input.match(/Ã|Ä|Å|È|Â|â€|�/g);
  return matches?.length ?? 0;
}

function fixMojibake(input: string) {
  if (!/[ÃÄÅÈÂ]|â€|�/.test(input)) {
    return input;
  }

  const bytes = encodeWindows1252(input);
  if (!bytes) {
    return input;
  }

  const decoded = bytes.toString("utf8");
  return mojibakeScore(decoded) < mojibakeScore(input) ? decoded : input;
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

function normalizeLegacyImagePath(image?: string | null) {
  if (!image) {
    return null;
  }

  if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
    return image;
  }

  return `/legacy/${image.replace(/^\/+/, "")}`;
}

function buildPosts(
  postRows: SqlValue[][],
  categoryIdMap: Map<string, string> = new Map(),
) {
  return postRows.map((row) => {
    const createdAt = row[7]
      ? new Date(String(row[7]).replace(" ", "T")).toISOString()
      : new Date().toISOString();
    const contentHtml = String(row[5] ?? "");
    const legacyCategoryId = row[4] ? String(row[4]) : null;

    return {
      category_id: legacyCategoryId
        ? categoryIdMap.get(legacyCategoryId) ?? legacyCategoryId
        : null,
      content_html: contentHtml,
      content_json: { type: "html", html: contentHtml },
      cover_image_path: normalizeLegacyImagePath(row[3]),
      created_at: createdAt,
      excerpt: row[6] ? String(row[6]) : null,
      published_at: createdAt,
      slug: String(row[2] ?? slugify(String(row[1] ?? ""))),
      status: "published",
      title: String(row[1] ?? ""),
      updated_at: createdAt,
    };
  });
}

async function upsertCategories(
  supabase: SupabaseClient,
  categories: BlogCategoryImport[],
) {
  const categoryIdMap = new Map<string, string>();
  let reused = 0;
  let insertedOrUpdated = 0;

  for (const category of categories) {
    const { data: existingBySlug, error: selectError } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", category.slug)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existingBySlug?.id) {
      const { error: updateError } = await supabase
        .from("blog_categories")
        .update({
          name: category.name,
          sort_order: category.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBySlug.id);

      if (updateError) {
        throw updateError;
      }

      categoryIdMap.set(category.id, String(existingBySlug.id));
      reused += 1;
      continue;
    }

    const { error: upsertError } = await supabase
      .from("blog_categories")
      .upsert(category, { onConflict: "id" });

    if (upsertError) {
      throw upsertError;
    }

    categoryIdMap.set(category.id, category.id);
    insertedOrUpdated += 1;
  }

  return {
    categoryIdMap,
    insertedOrUpdated,
    reused,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.find((arg) => !arg.startsWith("--"));

  return {
    dryRun,
    sqlPath: positional ?? DEFAULT_SQL_PATH,
  };
}

async function main() {
  loadDotenv();

  const { dryRun, sqlPath } = parseArgs();
  const sql = await readFile(resolve(sqlPath), "utf8");
  const categoryRows = extractInsertBlocks(sql, "categories").flatMap(parseValueTuples);
  const postRows = extractInsertBlocks(sql, "posts").flatMap(parseValueTuples);

  if (!categoryRows.length || !postRows.length) {
    throw new Error(
      `Nu am gasit categorii/postari in dump. categories=${categoryRows.length}, posts=${postRows.length}`,
    );
  }

  const categories: BlogCategoryImport[] = categoryRows.map((row, index) => {
    const id = String(row[0]);
    const name = String(row[1] ?? "");

    return {
      id,
      name,
      slug: slugify(name),
      sort_order: index + 1,
    };
  });
  const postsForPreview = buildPosts(postRows);

  console.log(`Parsed ${categories.length} blog categories and ${postsForPreview.length} posts from ${sqlPath}.`);
  console.log("Sample categories:", categories.map((category) => category.name).join(", "));
  console.log("Sample posts:", postsForPreview.slice(0, 3).map((post) => post.title).join(" | "));

  if (dryRun) {
    console.log("Dry run: no database writes performed.");
    return;
  }

  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const categoryImport = await upsertCategories(supabase, categories);
  const posts = buildPosts(postRows, categoryImport.categoryIdMap);

  const { error: postsError } = await supabase
    .from("blog_posts")
    .upsert(posts, { onConflict: "slug" });
  if (postsError) {
    throw postsError;
  }

  console.log(
    `Imported ${posts.length} posts. Categories: ${categoryImport.insertedOrUpdated} inserted/updated, ${categoryImport.reused} reused by slug.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
