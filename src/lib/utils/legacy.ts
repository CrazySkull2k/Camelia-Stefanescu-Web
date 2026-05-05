import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

function rootFilePath(filename: string) {
  return path.join(process.cwd(), "src", "content", "legacy", filename);
}

export async function readLegacyFile(filename: string) {
  return readFile(rootFilePath(filename), "utf8");
}
