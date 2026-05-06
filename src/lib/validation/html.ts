import sanitizeHtml from "sanitize-html";

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  "article",
  "aside",
  "blockquote",
  "br",
  "code",
  "figure",
  "figcaption",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "img",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "section",
  "small",
  "source",
  "s",
  "strong",
  "sub",
  "sup",
  "ul",
]);

const sharedAttributes = [
  "class",
  "id",
  "title",
  "aria-label",
  "aria-hidden",
];

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags,
  allowedAttributes: {
    "*": sharedAttributes,
    a: [...sharedAttributes, "href", "name", "target", "rel"],
    code: [...sharedAttributes],
    img: [...sharedAttributes, "src", "srcset", "alt", "width", "height", "loading"],
    source: [...sharedAttributes, "srcset", "type", "media"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel", "data"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeRichHtml(value: string) {
  return sanitizeHtml(value, sanitizeConfig);
}
