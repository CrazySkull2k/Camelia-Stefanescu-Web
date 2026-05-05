import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const LOCAL_IMAGE_ROOT = "public/site";
const STORAGE_PREFIX = "site";

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    }),
  );

  return files.flat();
}

async function main() {
  const supabase = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const files = await walk(LOCAL_IMAGE_ROOT);
  let imported = 0;

  for (const filePath of files) {
    const relativePath = path
      .relative(LOCAL_IMAGE_ROOT, filePath)
      .replace(/\\/g, "/");
    const fileBuffer = await readFile(filePath).catch(() => null);
    const fileStat = await stat(filePath);

    if (!fileBuffer || fileStat.size === 0) {
      continue;
    }

    const uploadPath = `${STORAGE_PREFIX}/${relativePath}`;
    const uploadResult = await supabase.storage
      .from("site-media")
      .upload(uploadPath, fileBuffer, { upsert: true });

    if (!uploadResult.error) {
      imported += 1;
      await supabase.from("media_assets").upsert({
        bucket_name: "site-media",
        storage_path: uploadPath,
        kind: "image",
      });
    }
  }

  console.log(`Imported ${imported} site image assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
