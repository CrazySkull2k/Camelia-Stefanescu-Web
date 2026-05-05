"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { resolvePublicMediaUrl } from "@/lib/media";
import { uploadPublicFileWithSignedUrl } from "@/lib/uploads/browser-signed-upload";
import {
  CMS_IMAGE_OVERRIDES_SECTION,
  CMS_TEXT_OVERRIDES_SECTION,
  accentPresetLabels,
  cmsAccentPresets,
  type CmsCardFieldDefinition,
  type CmsFieldDefinition,
  type CmsImageOverride,
  type CmsImageValue,
  type CmsPageContent,
  type CmsPageDefinition,
  type CmsSectionContent,
  type CmsTextOverride,
} from "@/modules/cms/registry";

type PageContentEditorProps = {
  actionUrl: string;
  definition: CmsPageDefinition;
  error?: string | null;
  hasDraft: boolean;
  hasPublished: boolean;
  initialContent: CmsPageContent;
  status?: string | null;
};

type EditorMode = "visual" | "structured";

type EditablePreviewItem = {
  cardField?: CmsCardFieldDefinition;
  cardFieldName?: string;
  field: CmsFieldDefinition;
  fieldName: string;
  id: string;
  itemIndex?: number;
  kind: "image" | "text";
  label: string;
  sectionKey: string;
  value: unknown;
};

type GenericPreviewSelection =
  | {
      id: string;
      kind: "text";
      label: string;
      text: string;
    }
  | {
      alt: string;
      id: string;
      kind: "image";
      label: string;
      src: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSection(content: CmsPageContent, sectionKey: string): CmsSectionContent {
  return isRecord(content[sectionKey]) ? content[sectionKey] : {};
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getImageValue(value: unknown): CmsImageValue {
  if (!isRecord(value)) {
    return { alt: "", src: "" };
  }

  return {
    alt: typeof value.alt === "string" ? value.alt : "",
    src: typeof value.src === "string" ? value.src : "",
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isSimpleEditableField(field: CmsFieldDefinition | CmsCardFieldDefinition) {
  return (
    field.type === "image" ||
    field.type === "text" ||
    field.type === "textarea" ||
    field.type === "richText"
  );
}

function createEmptyCardFieldValue(field: CmsCardFieldDefinition) {
  if (field.type === "image") {
    return { alt: "", src: "" };
  }

  if (field.type === "list") {
    return [];
  }

  if (field.type === "accentPreset") {
    return "default";
  }

  return "";
}

function createEmptyItem(field: CmsFieldDefinition) {
  if (field.type === "stats") {
    return { label: "", value: "" };
  }

  if (field.type === "faq") {
    return { answer: "", question: "" };
  }

  if (field.type === "cards") {
    return Object.fromEntries(
      field.cardFields.map((cardField) => [
        cardField.name,
        createEmptyCardFieldValue(cardField),
      ]),
    );
  }

  return "";
}

export function PageContentEditor({
  actionUrl,
  definition,
  error,
  hasDraft,
  hasPublished,
  initialContent,
  status,
}: PageContentEditorProps) {
  const saveFormId = "page-content-save-form";
  const [content, setContent] = useState<CmsPageContent>(initialContent);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [genericSelection, setGenericSelection] = useState<GenericPreviewSelection | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const serializedContent = useMemo(() => JSON.stringify(content), [content]);
  const exactPreviewSrc = `/admin/content/${definition.pageKey}/preview?status=${encodeURIComponent(status ?? "draft")}`;
  const editablePreviewItems = useMemo(() => {
    const items: EditablePreviewItem[] = [];

    for (const section of definition.sections) {
      const sectionContent = getSection(content, section.key);

      for (const field of section.fields) {
        const value = sectionContent[field.name];

        if (isSimpleEditableField(field)) {
          items.push({
            field,
            fieldName: field.name,
            id: `${section.key}.${field.name}`,
            kind: field.type === "image" ? "image" : "text",
            label: `${section.title} / ${field.label}`,
            sectionKey: section.key,
            value,
          });
        }

        if (field.type === "cards") {
          const cardItems = getArray(value);

          cardItems.forEach((item, itemIndex) => {
            const record = isRecord(item) ? item : {};

            for (const cardField of field.cardFields) {
              if (!isSimpleEditableField(cardField)) {
                continue;
              }

              items.push({
                cardField,
                cardFieldName: cardField.name,
                field,
                fieldName: field.name,
                id: `${section.key}.${field.name}.${itemIndex}.${cardField.name}`,
                itemIndex,
                kind: cardField.type === "image" ? "image" : "text",
                label: `${section.title} / ${field.label} ${itemIndex + 1} / ${cardField.label}`,
                sectionKey: section.key,
                value: record[cardField.name],
              });
            }
          });
        }
      }
    }

    return items;
  }, [content, definition]);
  const selectedItem = editablePreviewItems.find((item) => item.id === selectedItemId) ?? null;
  const textOverrides = useMemo(
    () =>
      isRecord(content[CMS_TEXT_OVERRIDES_SECTION])
        ? (content[CMS_TEXT_OVERRIDES_SECTION] as Record<string, CmsTextOverride>)
        : {},
    [content],
  );
  const imageOverrides = useMemo(
    () =>
      isRecord(content[CMS_IMAGE_OVERRIDES_SECTION])
        ? (content[CMS_IMAGE_OVERRIDES_SECTION] as Record<string, CmsImageOverride>)
        : {},
    [content],
  );
  const selectPreviewItem = useCallback((id: string | null) => {
    if (!id) {
      return;
    }

    setMode("visual");
    setGenericSelection(null);
    setSelectedItemId(id);
    window.setTimeout(() => {
      inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  }, []);

  function updateField(sectionKey: string, fieldName: string, value: unknown) {
    setContent((current) => ({
      ...current,
      [sectionKey]: {
        ...getSection(current, sectionKey),
        [fieldName]: value,
      },
    }));
  }

  function updateArrayItem(
    sectionKey: string,
    fieldName: string,
    index: number,
    value: unknown,
  ) {
    const section = getSection(content, sectionKey);
    const items = [...getArray(section[fieldName])];
    items[index] = value;
    updateField(sectionKey, fieldName, items);
  }

  function removeArrayItem(sectionKey: string, fieldName: string, index: number) {
    const section = getSection(content, sectionKey);
    const items = getArray(section[fieldName]).filter((_, itemIndex) => itemIndex !== index);
    updateField(sectionKey, fieldName, items);
  }

  function addArrayItem(sectionKey: string, field: CmsFieldDefinition) {
    const section = getSection(content, sectionKey);
    const items = [...getArray(section[field.name]), createEmptyItem(field)];
    updateField(sectionKey, field.name, items);
  }

  function updateEditablePreviewItem(item: EditablePreviewItem, value: unknown) {
    if (typeof item.itemIndex === "number" && item.cardFieldName) {
      const section = getSection(content, item.sectionKey);
      const items = [...getArray(section[item.fieldName])];
      const currentItem = isRecord(items[item.itemIndex]) ? items[item.itemIndex] : {};
      items[item.itemIndex] = {
        ...currentItem,
        [item.cardFieldName]: value,
      };
      updateField(item.sectionKey, item.fieldName, items);
      return;
    }

    updateField(item.sectionKey, item.fieldName, value);
  }

  function updateTextOverride(selection: Extract<GenericPreviewSelection, { kind: "text" }>, text: string) {
    updateField(CMS_TEXT_OVERRIDES_SECTION, selection.id, {
      label: selection.label,
      text,
    });
    setGenericSelection({ ...selection, text });
  }

  function updateImageOverride(selection: Extract<GenericPreviewSelection, { kind: "image" }>, image: CmsImageValue) {
    updateField(CMS_IMAGE_OVERRIDES_SECTION, selection.id, {
      ...image,
      label: selection.label,
    });
    setGenericSelection({ ...selection, ...image });
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "camelia-cms-select") {
        return;
      }

      const item = event.data.item as GenericPreviewSelection | undefined;

      if (!item?.id) {
        return;
      }

      setMode("visual");
      setSelectedItemId(null);
      setGenericSelection(item);
      window.setTimeout(() => {
        inspectorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (mode !== "visual") {
      return;
    }

    previewFrameRef.current?.contentWindow?.postMessage(
      {
        imageOverrides,
        textOverrides,
        type: "camelia-cms-overrides",
      },
      window.location.origin,
    );
  }, [imageOverrides, mode, textOverrides]);

  async function handleImageUpload({
    current,
    fieldKey,
    onChange,
    file,
  }: {
    current: CmsImageValue;
    fieldKey: string;
    file?: File | null;
    onChange: (value: CmsImageValue) => void;
  }) {
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadingKey(fieldKey);

    try {
      const publicPath = await uploadPublicFileWithSignedUrl({
        altText: current.alt,
        file,
        folder: "site-media",
        kind: "page-image",
      });
      onChange({ ...current, src: publicPath });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload esuat.");
    } finally {
      setUploadingKey(null);
    }
  }

  function renderStructuredImageField({
    field,
    fieldKey,
    value,
    onChange,
  }: {
    field: CmsFieldDefinition | CmsCardFieldDefinition;
    fieldKey: string;
    onChange: (value: CmsImageValue) => void;
    value: unknown;
  }) {
    const image = getImageValue(value);
    const preview = resolvePublicMediaUrl(image.src);

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[1.5rem] border border-[#d8d5cc] bg-[#f5f4ed]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={image.alt || field.label} className="h-52 w-full object-cover" src={preview} />
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-[#5e6058]">
              Nicio imagine selectata
            </div>
          )}
        </div>
        <input
          className="admin-input"
          placeholder="Alt text"
          type="text"
          value={image.alt}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
        />
        <input
          accept="image/*"
          className="admin-input"
          type="file"
          onChange={(event) =>
            void handleImageUpload({
              current: image,
              fieldKey,
              file: event.target.files?.[0],
              onChange,
            })
          }
        />
        <p className="text-xs text-[#5e6058]">
          {uploadingKey === fieldKey ? "Se incarca imaginea..." : "Upload in bucket-ul site-media."}
        </p>
      </div>
    );
  }

  function renderStructuredCardField({
    cardField,
    fieldKey,
    item,
    onChange,
  }: {
    cardField: CmsCardFieldDefinition;
    fieldKey: string;
    item: Record<string, unknown>;
    onChange: (value: unknown) => void;
  }) {
    const value = item[cardField.name];

    if (cardField.type === "textarea" || cardField.type === "richText") {
      return (
        <textarea
          className="admin-textarea min-h-28"
          value={getStringValue(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }

    if (cardField.type === "image") {
      return renderStructuredImageField({
        field: cardField,
        fieldKey,
        onChange: onChange as (value: CmsImageValue) => void,
        value,
      });
    }

    if (cardField.type === "list") {
      return (
        <textarea
          className="admin-textarea min-h-28"
          value={getArray(value).join("\n")}
          onChange={(event) => onChange(event.target.value.split(/\r?\n/))}
        />
      );
    }

    if (cardField.type === "accentPreset") {
      return (
        <select
          className="admin-select"
          value={getStringValue(value) || "default"}
          onChange={(event) => onChange(event.target.value)}
        >
          {cmsAccentPresets.map((preset) => (
            <option key={preset} value={preset}>
              {accentPresetLabels[preset]}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="admin-input"
        type="text"
        value={getStringValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  function renderStructuredField(sectionKey: string, field: CmsFieldDefinition) {
    const section = getSection(content, sectionKey);
    const value = section[field.name];

    if (field.type === "textarea" || field.type === "richText") {
      return (
        <textarea
          className="admin-textarea min-h-36"
          name={`${sectionKey}.${field.name}`}
          value={getStringValue(value)}
          onChange={(event) => updateField(sectionKey, field.name, event.target.value)}
        />
      );
    }

    if (field.type === "image") {
      return renderStructuredImageField({
        field,
        fieldKey: `${sectionKey}.${field.name}`,
        onChange: (image) => updateField(sectionKey, field.name, image),
        value,
      });
    }

    if (field.type === "list") {
      return (
        <textarea
          className="admin-textarea min-h-36"
          name={`${sectionKey}.${field.name}`}
          value={getArray(value).join("\n")}
          onChange={(event) => updateField(sectionKey, field.name, event.target.value.split(/\r?\n/))}
        />
      );
    }

    if (field.type === "stats") {
      const items = getArray(value);

      return (
        <div className="space-y-3">
          {items.map((item, index) => {
            const record = isRecord(item) ? item : {};

            return (
              <div className="grid gap-3 rounded-[1.25rem] bg-[#f5f4ed] p-3 md:grid-cols-[0.4fr_1fr_auto]" key={index}>
                <input
                  className="admin-input"
                  placeholder="Valoare"
                  value={getStringValue(record.value)}
                  onChange={(event) =>
                    updateArrayItem(sectionKey, field.name, index, {
                      ...record,
                      value: event.target.value,
                    })
                  }
                />
                <input
                  className="admin-input"
                  placeholder="Eticheta"
                  value={getStringValue(record.label)}
                  onChange={(event) =>
                    updateArrayItem(sectionKey, field.name, index, {
                      ...record,
                      label: event.target.value,
                    })
                  }
                />
                <button
                  className="rounded-full px-4 text-sm font-bold text-[#752121] hover:bg-[#fe8983]/30"
                  type="button"
                  onClick={() => removeArrayItem(sectionKey, field.name, index)}
                >
                  Sterge
                </button>
              </div>
            );
          })}
          {(field.maxItems ?? 6) > items.length ? (
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => addArrayItem(sectionKey, field)}>
              Adauga
            </button>
          ) : null}
        </div>
      );
    }

    if (field.type === "faq") {
      const items = getArray(value);

      return (
        <div className="space-y-4">
          {items.map((item, index) => {
            const record = isRecord(item) ? item : {};

            return (
              <div className="space-y-3 rounded-[1.25rem] bg-[#f5f4ed] p-4" key={index}>
                <input
                  className="admin-input"
                  placeholder="Intrebare"
                  value={getStringValue(record.question)}
                  onChange={(event) =>
                    updateArrayItem(sectionKey, field.name, index, {
                      ...record,
                      question: event.target.value,
                    })
                  }
                />
                <textarea
                  className="admin-textarea min-h-28"
                  placeholder="Raspuns"
                  value={getStringValue(record.answer)}
                  onChange={(event) =>
                    updateArrayItem(sectionKey, field.name, index, {
                      ...record,
                      answer: event.target.value,
                    })
                  }
                />
                <button
                  className="rounded-full px-4 py-2 text-sm font-bold text-[#752121] hover:bg-[#fe8983]/30"
                  type="button"
                  onClick={() => removeArrayItem(sectionKey, field.name, index)}
                >
                  Sterge
                </button>
              </div>
            );
          })}
          {(field.maxItems ?? 10) > items.length ? (
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => addArrayItem(sectionKey, field)}>
              Adauga
            </button>
          ) : null}
        </div>
      );
    }

    if (field.type === "cards") {
      const items = getArray(value);

      return (
        <div className="space-y-5">
          {items.map((item, index) => {
            const record = isRecord(item) ? item : {};

            return (
              <div className="space-y-4 rounded-[1.5rem] border border-[#d8d5cc] bg-[#fbf9f4] p-4" key={index}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#735a42]">
                    Element {index + 1}
                  </p>
                  <button
                    className="rounded-full px-4 py-2 text-sm font-bold text-[#752121] hover:bg-[#fe8983]/30"
                    type="button"
                    onClick={() => removeArrayItem(sectionKey, field.name, index)}
                  >
                    Sterge
                  </button>
                </div>
                {field.cardFields.map((cardField) => (
                  <label className="block space-y-2" key={cardField.name}>
                    <span className="text-sm font-bold text-[#31332c]">{cardField.label}</span>
                    {renderStructuredCardField({
                      cardField,
                      fieldKey: `${sectionKey}.${field.name}.${index}.${cardField.name}`,
                      item: record,
                      onChange: (nextValue) =>
                        updateArrayItem(sectionKey, field.name, index, {
                          ...record,
                          [cardField.name]: nextValue,
                        }),
                    })}
                  </label>
                ))}
              </div>
            );
          })}
          {(field.maxItems ?? 8) > items.length ? (
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => addArrayItem(sectionKey, field)}>
              Adauga
            </button>
          ) : null}
        </div>
      );
    }

    if (field.type === "accentPreset") {
      return (
        <select
          className="admin-select"
          name={`${sectionKey}.${field.name}`}
          value={getStringValue(value) || "default"}
          onChange={(event) => updateField(sectionKey, field.name, event.target.value)}
        >
          {cmsAccentPresets.map((preset) => (
            <option key={preset} value={preset}>
              {accentPresetLabels[preset]}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="admin-input"
        name={`${sectionKey}.${field.name}`}
        type="text"
        value={getStringValue(value)}
        onChange={(event) => updateField(sectionKey, field.name, event.target.value)}
      />
    );
  }

  function renderSelectedEditor() {
    if (genericSelection) {
      if (genericSelection.kind === "image") {
        const override = imageOverrides[genericSelection.id];
        const image = {
          alt: override?.alt ?? genericSelection.alt,
          src: override?.src ?? genericSelection.src,
        };

        return (
          <div className="rounded-[1.5rem] border border-[#d8d5cc] bg-[#fbf9f4] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#735a42]">
              Imagine selectata
            </p>
            <h3 className="mt-2 font-serif text-2xl text-[#31332c]">{genericSelection.label}</h3>
            <div className="mt-5">
              {renderStructuredImageField({
                field: { label: genericSelection.label, name: genericSelection.id, type: "image" },
                fieldKey: genericSelection.id,
                onChange: (nextImage) => updateImageOverride(genericSelection, nextImage),
                value: image,
              })}
            </div>
          </div>
        );
      }

      const override = textOverrides[genericSelection.id];
      const text = override?.text ?? genericSelection.text;

      return (
        <div className="rounded-[1.5rem] border border-[#d8d5cc] bg-[#fbf9f4] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#735a42]">
            Text selectat
          </p>
          <h3 className="mt-2 font-serif text-2xl text-[#31332c]">{genericSelection.label}</h3>
          <textarea
            className="admin-textarea mt-5 min-h-40"
            value={text}
            onChange={(event) => updateTextOverride(genericSelection, event.target.value)}
          />
        </div>
      );
    }

    if (!selectedItem) {
      return (
        <div className="rounded-[1.5rem] border border-dashed border-[#d8d5cc] bg-[#fbf9f4] p-5 text-sm leading-6 text-[#5e6058]">
          Selecteaza un text sau o imagine din pagina din stanga. Textele din continutul paginii au outline dotted; navbarul si footerul sunt excluse.
        </div>
      );
    }

    const field = selectedItem.cardField ?? selectedItem.field;

    return (
      <div className="rounded-[1.5rem] border border-[#d8d5cc] bg-[#fbf9f4] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#735a42]">
          Bloc selectat
        </p>
        <h3 className="mt-2 font-serif text-2xl text-[#31332c]">{selectedItem.label}</h3>

        <div className="mt-5">
          {selectedItem.kind === "image" ? (
            renderStructuredImageField({
              field,
              fieldKey: selectedItem.id,
              onChange: (image) => updateEditablePreviewItem(selectedItem, image),
              value: selectedItem.value,
            })
          ) : field.type === "text" ? (
            <input
              className="admin-input"
              maxLength={"maxLength" in field ? field.maxLength : undefined}
              value={getStringValue(selectedItem.value)}
              onChange={(event) => updateEditablePreviewItem(selectedItem, event.target.value)}
            />
          ) : (
            <textarea
              className="admin-textarea min-h-40"
              maxLength={"maxLength" in field ? field.maxLength : undefined}
              value={getStringValue(selectedItem.value)}
              onChange={(event) => updateEditablePreviewItem(selectedItem, event.target.value)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={actionUrl} id={saveFormId} method="post">
        <input name="intent" type="hidden" value="save" />
        <input name="content_json" type="hidden" value={serializedContent} />
      </form>

      {error ? (
        <div className="rounded-[1.25rem] border border-[#fe8983]/60 bg-[#fff7f6] px-5 py-4 text-sm font-semibold text-[#752121]">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-[1.25rem] border border-[#ffdcbd]/60 bg-[#fff7f3] px-5 py-4 text-sm font-semibold text-[#654d35]">
          {status === "draft-saved"
            ? "Draftul a fost salvat. Pagina publica nu s-a modificat inca."
            : status === "published"
              ? "Pagina a fost publicata."
              : status === "draft-discarded"
                ? "Draftul a fost sters."
                : "Modificarile au fost procesate."}
        </div>
      ) : null}

      <div className="admin-card sticky top-4 z-30 p-4 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
              Editor pagina
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <h1 className="font-serif text-4xl text-[#31332c]">{definition.label}</h1>
              <span className="pb-2 text-sm text-[#5e6058]">
                {hasDraft
                  ? "Draft nepublicat"
                  : hasPublished
                    ? "Publicata"
                    : "Fara continut CMS publicat"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-[#d8d5cc] bg-[#f5f4ed] p-1">
              <button
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-bold transition",
                  mode === "visual" ? "bg-white text-[#31332c] shadow-sm" : "text-[#5e6058]",
                )}
                type="button"
                onClick={() => setMode("visual")}
              >
                Preview exact
              </button>
              <button
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-bold transition",
                  mode === "structured" ? "bg-white text-[#31332c] shadow-sm" : "text-[#5e6058]",
                )}
                type="button"
                onClick={() => setMode("structured")}
              >
                Structurat
              </button>
            </div>
            <a
              className="admin-btn admin-btn-secondary"
              href={definition.route}
              rel="noreferrer"
              target="_blank"
            >
              Vezi public
            </a>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="rounded-[1.25rem] border border-[#fe8983]/60 bg-[#fff7f6] px-5 py-4 text-sm font-semibold text-[#752121]">
          {uploadError}
        </div>
      ) : null}

      {mode === "visual" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]">
          <div className="overflow-hidden rounded-[2rem] border border-[#d8d5cc] bg-white shadow-[0px_18px_60px_rgba(49,51,44,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8d5cc] bg-[#f5f4ed] px-5 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                  Pagina reala
                </p>
                <p className="text-xs text-[#5e6058]">
                  Preview-ul foloseste ruta publica si draftul salvat. Apasa Salveaza Draft pentru refresh.
                </p>
              </div>
              <a
                className="rounded-full border border-[#d8d5cc] bg-white px-4 py-2 text-xs font-bold text-[#31332c] transition hover:bg-[#efeee6]"
                href={exactPreviewSrc}
                rel="noreferrer"
                target="_blank"
              >
                Deschide preview
              </a>
            </div>
            <iframe
              className="h-[calc(100vh-15rem)] min-h-[48rem] w-full bg-[#fbf9f4]"
              key={exactPreviewSrc}
              ref={previewFrameRef}
              src={exactPreviewSrc}
              title={`Preview exact ${definition.label}`}
            />
          </div>

          <aside
            className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[2rem] border border-[#d8d5cc] bg-white p-5 shadow-[0px_18px_60px_rgba(49,51,44,0.06)]"
            ref={inspectorRef}
          >
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42]">
                Campuri editabile
              </p>
              <p className="mt-2 text-sm text-[#5e6058]">
                Click pe un element cu outline dotted din pagina. Editorul pentru blocul selectat apare aici.
              </p>
            </div>
            <div className="space-y-5">
              {renderSelectedEditor()}
              <div className="rounded-[1.5rem] border border-[#d8d5cc] bg-[#fbf9f4] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#735a42]">
                  Elemente detectate
                </p>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {editablePreviewItems.map((item) => (
                    <button
                      className={clsx(
                        "block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
                        selectedItemId === item.id
                          ? "bg-[#ffdcbd] text-[#513b25]"
                          : "bg-white text-[#5e6058] hover:bg-[#efeee6]",
                      )}
                      key={item.id}
                      type="button"
                      onClick={() => selectPreviewItem(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          {definition.sections.map((section) => (
            <section className="admin-card p-6" key={section.key}>
              <div className="mb-6">
                <h2 className="font-serif text-3xl text-[#31332c]">{section.title}</h2>
                {section.description ? (
                  <p className="mt-2 text-sm text-[#5e6058]">{section.description}</p>
                ) : null}
              </div>

              <div className="grid gap-5">
                {section.fields.map((field) => (
                  <label className="block space-y-2" key={field.name}>
                    <span className="text-sm font-bold text-[#31332c]">{field.label}</span>
                    {field.helpText ? (
                      <span className="block text-xs text-[#5e6058]">{field.helpText}</span>
                    ) : null}
                    {renderStructuredField(section.key, field)}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="sticky bottom-6 z-40 flex flex-wrap items-center gap-3 rounded-full border border-[#d8d5cc] bg-white/92 p-3 shadow-[0px_18px_52px_rgba(49,51,44,0.14)] backdrop-blur">
        <button
          className="admin-cta-primary rounded-full bg-[#31332c] px-6 py-3 text-sm font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c]"
          form={saveFormId}
          type="submit"
        >
          Salveaza Draft
        </button>
        <form action={actionUrl} method="post">
          <input name="intent" type="hidden" value="publish" />
          <button
            className={clsx(
              "admin-btn",
              hasDraft || !hasPublished ? "admin-btn-primary" : "admin-btn-secondary",
            )}
            type="submit"
          >
            Publica
          </button>
        </form>
        <form action={actionUrl} method="post">
          <input name="intent" type="hidden" value="discard" />
          <button className="admin-btn admin-btn-secondary" disabled={!hasDraft} type="submit">
            Renunta la Draft
          </button>
        </form>
        <span className="text-xs font-semibold text-[#5e6058]">
          Editezi draftul. Publicul vede schimbarile doar dupa publicare.
        </span>
      </div>
    </div>
  );
}
