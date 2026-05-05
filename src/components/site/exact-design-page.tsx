import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

type ExactDesignPageProps = {
  fileName: string;
  version: string;
};

type DesignPayload = {
  bodyClassName: string;
  css: string;
  html: string;
};

function scopeDesignCss(css: string) {
  return css.replace(
    /(^|}|,)\s*body(?=(?:\s|:|\{|\[|\.|#|>|\+|~|$))/gm,
    (_match, prefix: string) => `${prefix} [data-exact-design-root]`,
  );
}

const loadDesignPayload = cache(async (fileName: string): Promise<DesignPayload> => {
  const source = await readFile(path.join(process.cwd(), "designs", fileName), "utf8");
  const bodyMatch = source.match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);

  if (!bodyMatch) {
    throw new Error(`Design file ${fileName} does not contain a <body> element.`);
  }

  const bodyClassName = bodyMatch[1]?.match(/class=["']([^"']+)["']/i)?.[1] ?? "";
  const css = Array.from(source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

  let html = bodyMatch[2].trim();
  html = html.replace(/<header\b[\s\S]*?<\/header>/i, "").trim();
  html = html.replace(/<footer\b[\s\S]*?<\/footer>/i, "").trim();
  html = html.replace(/^\s*(?:<!--[\s\S]*?-->\s*)*<main\b([^>]*)>/i, "<div$1>");
  html = html.replace(/<\/main>\s*(?:<!--[\s\S]*?-->\s*)*$/i, "</div>");

  return {
    bodyClassName,
    css: scopeDesignCss(css),
    html,
  };
});

export async function ExactDesignPage({ fileName, version }: ExactDesignPageProps) {
  const design = await loadDesignPayload(fileName);

  return (
    <>
      {design.css ? <style dangerouslySetInnerHTML={{ __html: design.css }} /> : null}
      <div
        className={design.bodyClassName}
        data-exact-design-root=""
        data-cms-override-version={version}
        dangerouslySetInnerHTML={{ __html: design.html }}
      />
    </>
  );
}
