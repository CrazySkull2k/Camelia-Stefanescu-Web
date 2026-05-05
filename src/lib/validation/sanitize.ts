import sanitizeHtml from "sanitize-html";

export function sanitizePlainText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function sanitizeRecursive(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizePlainText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeRecursive);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, sanitizeRecursive(nested)]),
    );
  }

  return value;
}
