export type BlogEditorJson = {
  attrs?: Record<string, unknown>;
  content?: BlogEditorJson[];
  marks?: Array<Record<string, unknown>>;
  text?: string;
  type?: string;
  [key: string]: unknown;
};

export const EMPTY_TIPTAP_DOC: BlogEditorJson = {
  content: [{ type: "paragraph" }],
  type: "doc",
};

export function isTiptapDocument(value: unknown): value is BlogEditorJson {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "type" in value &&
    (value as { type?: unknown }).type === "doc"
  );
}

export function getInitialEditorContent(contentJson: unknown, contentHtml?: string | null) {
  if (isTiptapDocument(contentJson)) {
    return contentJson;
  }

  const html = contentHtml?.trim();
  return html || EMPTY_TIPTAP_DOC;
}
