"use client";
/* eslint-disable @next/next/no-img-element */

import type { Content } from "@tiptap/core";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import {
  Bold,
  Code2,
  Eye,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Save,
  Send,
  Trash2,
  Undo2,
  UploadCloud,
} from "lucide-react";
import NextLink from "next/link";
import { useRef, useState } from "react";

import { resolvePublicMediaUrl } from "@/lib/media";
import { uploadPublicFileWithSignedUrl } from "@/lib/uploads/browser-signed-upload";
import {
  EMPTY_TIPTAP_DOC,
  getInitialEditorContent,
  isTiptapDocument,
  type BlogEditorJson,
} from "@/modules/blog/editor-content";

import styles from "./blog-post-editor.module.css";

type BlogCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type BlogTagOption = {
  id: string;
  name: string;
  slug: string;
};

export type BlogEditorPost = {
  categoryId?: string | null;
  contentHtml?: string | null;
  contentJson?: unknown;
  coverImagePath?: string | null;
  excerpt?: string | null;
  id?: string;
  slug?: string;
  status?: string | null;
  tags?: BlogTagOption[];
  title?: string;
};

type BlogPostEditorProps = {
  actionUrl: string;
  allTags: BlogTagOption[];
  categories: BlogCategoryOption[];
  deleteActionUrl?: string;
  feedback?: { tone: "error" | "success"; value: string } | null;
  mode: "create" | "edit";
  post?: BlogEditorPost;
  previewHref?: string | null;
};

const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [2, 3, 4],
    },
  }),
  LinkExtension.configure({
    autolink: true,
    defaultProtocol: "https",
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank",
    },
    openOnClick: false,
  }),
  ImageExtension.configure({
    allowBase64: false,
    HTMLAttributes: {
      loading: "lazy",
    },
  }),
  Placeholder.configure({
    placeholder: "Incepe sa scrii povestea...",
  }),
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getInitialJson(contentJson: unknown): BlogEditorJson {
  return isTiptapDocument(contentJson) ? contentJson : EMPTY_TIPTAP_DOC;
}

function getHeadingValue(editor: Editor | null) {
  if (!editor) {
    return "paragraph";
  }

  if (editor.isActive("heading", { level: 2 })) {
    return "h2";
  }

  if (editor.isActive("heading", { level: 3 })) {
    return "h3";
  }

  if (editor.isActive("heading", { level: 4 })) {
    return "h4";
  }

  return "paragraph";
}

function ToolbarButton({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
        active
          ? "bg-[#5f5e5e] text-[#faf7f6]"
          : "text-[#5e6058] hover:bg-[#efeee6] hover:text-[#31332c]",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function BlogPostEditor({
  actionUrl,
  allTags,
  categories,
  deleteActionUrl,
  feedback,
  mode,
  post,
  previewHref,
}: BlogPostEditorProps) {
  const contentHtmlRef = useRef<HTMLInputElement>(null);
  const contentJsonRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const inlineImageFileRef = useRef<HTMLInputElement>(null);
  const [coverImagePath, setCoverImagePath] = useState(post?.coverImagePath ?? "");
  const [coverUrlInput, setCoverUrlInput] = useState(() => {
    const coverPath = post?.coverImagePath ?? "";
    return /^https?:\/\//i.test(coverPath) ? coverPath : "";
  });
  const [editorError, setEditorError] = useState<string | null>(null);
  const [inlineUploadBusy, setInlineUploadBusy] = useState(false);
  const [coverUploadBusy, setCoverUploadBusy] = useState(false);
  const [status, setStatus] = useState(post?.status === "published" ? "published" : "draft");
  const [tagInput, setTagInput] = useState(
    post?.tags?.map((tag) => tag.name).join(", ") ?? "",
  );
  const [, setEditorTick] = useState(0);
  const initialContent = getInitialEditorContent(post?.contentJson, post?.contentHtml) as Content;
  const initialJson = getInitialJson(post?.contentJson);
  const formId = `blog-post-editor-${post?.id ?? "new"}`;

  function writeEditorContent(editorInstance: Editor | null) {
    if (!editorInstance) {
      return;
    }

    if (contentHtmlRef.current) {
      contentHtmlRef.current.value = editorInstance.getHTML();
    }

    if (contentJsonRef.current) {
      contentJsonRef.current.value = JSON.stringify(editorInstance.getJSON());
    }
  }

  const editor = useEditor({
    content: initialContent,
    editorProps: {
      attributes: {
        "aria-label": "Continut articol",
      },
    },
    extensions: editorExtensions,
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      writeEditorContent(createdEditor);
      setEditorTick((tick) => tick + 1);
    },
    onSelectionUpdate: () => {
      setEditorTick((tick) => tick + 1);
    },
    onUpdate: ({ editor: updatedEditor }) => {
      writeEditorContent(updatedEditor);
      setEditorTick((tick) => tick + 1);
    },
  });

  const coverPreview = resolvePublicMediaUrl(coverImagePath);
  const tagNames = tagInput
    .split(/[,\n]/)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean);

  function handleSubmit() {
    writeEditorContent(editor);
  }

  function handleHeadingChange(value: string) {
    if (!editor) {
      return;
    }

    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = value === "h2" ? 2 : value === "h3" ? 3 : 4;
    editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run();
  }

  function handleLink() {
    if (!editor) {
      return;
    }

    const currentHref = String(editor.getAttributes("link").href ?? "");
    const nextHref = window.prompt("Link articol", currentHref);

    if (nextHref === null) {
      return;
    }

    const normalized = normalizeUrl(nextHref);
    if (!normalized) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  }

  function handleImageUrl() {
    if (!editor) {
      return;
    }

    const url = normalizeUrl(window.prompt("URL imagine externa") ?? "");
    if (!url) {
      return;
    }

    const alt = window.prompt("Alt text pentru imagine", "") ?? "";
    editor.chain().focus().setImage({ alt, src: url }).run();
  }

  async function handleCoverFileChange(file?: File | null) {
    if (!file) {
      return;
    }

    setCoverUploadBusy(true);
    setEditorError(null);

    try {
      const publicPath = await uploadPublicFileWithSignedUrl({
        altText: post?.title || file.name,
        file,
        folder: "blog-covers",
        kind: "blog-cover",
      });
      setCoverImagePath(publicPath);
      setCoverUrlInput("");
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Upload-ul a esuat.");
    } finally {
      setCoverUploadBusy(false);
      if (coverFileRef.current) {
        coverFileRef.current.value = "";
      }
    }
  }

  async function handleInlineImageFileChange(file?: File | null) {
    if (!file || !editor) {
      return;
    }

    setInlineUploadBusy(true);
    setEditorError(null);

    try {
      const altText = file.name.replace(/\.[^.]+$/, "");
      const publicPath = await uploadPublicFileWithSignedUrl({
        altText,
        file,
        folder: "blog-covers",
        kind: "blog-inline",
      });
      const publicUrl = resolvePublicMediaUrl(publicPath) ?? publicPath;
      editor.chain().focus().setImage({ alt: altText, src: publicUrl }).run();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Upload-ul a esuat.");
    } finally {
      setInlineUploadBusy(false);
      if (inlineImageFileRef.current) {
        inlineImageFileRef.current.value = "";
      }
    }
  }

  function applyCoverUrl() {
    const normalized = normalizeUrl(coverUrlInput);
    if (!normalized) {
      return;
    }

    setCoverImagePath(normalized);
    setCoverUrlInput(normalized);
  }

  return (
    <div className={clsx(styles.editorShell, "mx-auto max-w-7xl")}>
      <div className="sticky top-20 z-30 -mx-4 mb-8 border-b border-[#b1b3a9]/15 bg-[#fbf9f4]/88 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <NextLink
              className="text-xs font-bold uppercase tracking-[0.22em] text-[#735a42] transition hover:text-[#31332c]"
              href="/admin/blog"
            >
              Inapoi la articole
            </NextLink>
            <h1 className="mt-2 font-serif text-4xl leading-none text-[#31332c] sm:text-5xl">
              {mode === "create" ? "Articol nou" : "Editeaza articolul"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {previewHref ? (
              <NextLink
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#31332c] shadow-[0px_12px_32px_rgba(49,51,44,0.06)] transition hover:bg-[#efeee6]"
                href={previewHref}
                target="_blank"
              >
                <Eye className="h-4 w-4" />
                Preview
              </NextLink>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/60 px-5 py-3 text-sm font-bold text-[#5e6058]/55">
                <Eye className="h-4 w-4" />
                Preview dupa salvare
              </span>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#ffdcbd] px-5 py-3 text-sm font-bold text-[#654d35] transition hover:bg-[#f0cfb0]"
              form={formId}
              name="intent"
              type="submit"
              value="draft"
            >
              <Save className="h-4 w-4" />
              Salveaza ciorna
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#5f5e5e] px-5 py-3 text-sm font-bold text-[#faf7f6] shadow-[0px_12px_32px_rgba(49,51,44,0.12)] transition hover:bg-[#535252]"
              form={formId}
              name="intent"
              type="submit"
              value="published"
            >
              <Send className="h-4 w-4" />
              Publica
            </button>
          </div>
        </div>
      </div>

      {editorError ? (
        <div className="mb-6 rounded-[1.5rem] border border-[#fe8983]/40 bg-[#fff7f6] px-5 py-4 text-sm font-semibold text-[#752121]">
          {editorError}
        </div>
      ) : null}
      {!editorError && feedback ? (
        <div
          className={clsx(
            "mb-6 rounded-[1.5rem] px-5 py-4 text-sm font-semibold",
            feedback.tone === "error"
              ? "border border-[#fe8983]/40 bg-[#fff7f6] text-[#752121]"
              : "border border-[#ffdcbd]/60 bg-[#fff7f3] text-[#654d35]",
          )}
        >
          {feedback.value}
        </div>
      ) : null}

      <form
        action={actionUrl}
        className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]"
        id={formId}
        method="post"
        onSubmit={handleSubmit}
      >
        <input
          ref={contentHtmlRef}
          name="content_html"
          type="hidden"
          defaultValue={post?.contentHtml ?? ""}
        />
        <input
          ref={contentJsonRef}
          name="content_json"
          type="hidden"
          defaultValue={JSON.stringify(initialJson)}
        />
        <input name="cover_image_path" readOnly type="hidden" value={coverImagePath} />
        <input name="tags" readOnly type="hidden" value={tagNames.join(", ")} />
        <input name="status" readOnly type="hidden" value={status} />

        <section className="space-y-8">
          <div className="rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] sm:p-8">
            <label className="sr-only" htmlFor="blog-title">
              Titlu articol
            </label>
            <input
              className="w-full border-0 bg-transparent px-0 pb-4 font-serif text-5xl leading-none tracking-tight text-[#31332c] outline-none ring-0 placeholder:text-[#5e6058]/35 focus:ring-0 sm:text-6xl"
              defaultValue={post?.title ?? ""}
              id="blog-title"
              maxLength={180}
              name="title"
              placeholder="Titlu articol"
              required
              type="text"
            />
            <div className="grid gap-4 border-t border-[#b1b3a9]/15 pt-5 md:grid-cols-[1fr_0.8fr]">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
                Slug
                <input
                  className="rounded-2xl border border-transparent bg-[#efeee6] px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#31332c] outline-none transition focus:border-[#5f5e5e]/25 focus:bg-white"
                  defaultValue={post?.slug ?? ""}
                  name="slug"
                  placeholder="se-genereaza-din-titlu"
                  type="text"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
                Status curent
                <select
                  className="appearance-none rounded-2xl border border-transparent bg-[#efeee6] px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#31332c] outline-none transition focus:border-[#5f5e5e]/25 focus:bg-white"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="draft">Ciorna</option>
                  <option value="published">Publicat</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#b1b3a9]/15 bg-[#efeee6] shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <button
              className="group relative flex aspect-video w-full items-center justify-center overflow-hidden text-[#5e6058]"
              type="button"
              onClick={() => coverFileRef.current?.click()}
            >
              {coverPreview ? (
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  src={coverPreview}
                />
              ) : null}
              <span
                className={clsx(
                  "relative z-10 flex flex-col items-center gap-3 rounded-[1.5rem] px-6 py-5 text-center backdrop-blur",
                  coverPreview ? "bg-white/82" : "bg-white/70",
                )}
              >
                <UploadCloud className="h-8 w-8" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  {coverUploadBusy ? "Se incarca..." : "Imagine reprezentativa"}
                </span>
              </span>
            </button>
            <input
              ref={coverFileRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={(event) => void handleCoverFileChange(event.target.files?.[0])}
            />
            <details className="border-t border-[#b1b3a9]/15 bg-white/70 p-4">
              <summary className="cursor-pointer text-sm font-bold text-[#5e6058] transition hover:text-[#31332c]">
                Foloseste un URL extern in loc de upload
              </summary>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  className="rounded-full border border-transparent bg-white px-4 py-3 text-sm text-[#31332c] outline-none transition placeholder:text-[#5e6058]/55 focus:border-[#5f5e5e]/25"
                  placeholder="https://..."
                  type="text"
                  value={coverUrlInput}
                  onChange={(event) => setCoverUrlInput(event.target.value)}
                />
                <button
                  className="rounded-full bg-[#31332c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#535252]"
                  type="button"
                  onClick={applyCoverUrl}
                >
                  Foloseste URL
                </button>
              </div>
            </details>
          </div>

          <div className="sticky top-44 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-[#b1b3a9]/15 bg-white/88 p-2 shadow-[0px_12px_32px_rgba(49,51,44,0.08)] backdrop-blur-xl">
            <select
              aria-label="Stil paragraf"
              className="h-10 rounded-full border-0 bg-[#efeee6] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5e6058] outline-none ring-0 focus:ring-1 focus:ring-[#5f5e5e]/25"
              value={getHeadingValue(editor)}
              onChange={(event) => handleHeadingChange(event.target.value)}
            >
              <option value="paragraph">Text</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
            </select>
            <ToolbarButton
              active={editor?.isActive("bold")}
              disabled={!editor}
              icon={Bold}
              label="Bold"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              active={editor?.isActive("italic")}
              disabled={!editor}
              icon={Italic}
              label="Italic"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            />
            <span className="mx-1 h-6 w-px bg-[#b1b3a9]/35" />
            <ToolbarButton
              active={editor?.isActive("link")}
              disabled={!editor}
              icon={Link2}
              label="Link"
              onClick={handleLink}
            />
            <ToolbarButton
              active={editor?.isActive("bulletList")}
              disabled={!editor}
              icon={List}
              label="Lista"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              active={editor?.isActive("orderedList")}
              disabled={!editor}
              icon={ListOrdered}
              label="Lista numerotata"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              active={editor?.isActive("blockquote")}
              disabled={!editor}
              icon={Quote}
              label="Citat"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton
              active={editor?.isActive("codeBlock")}
              disabled={!editor}
              icon={Code2}
              label="Code block"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            />
            <span className="mx-1 h-6 w-px bg-[#b1b3a9]/35" />
            <ToolbarButton
              disabled={!editor || inlineUploadBusy}
              icon={ImagePlus}
              label={inlineUploadBusy ? "Se incarca imaginea" : "Incarca imagine"}
              onClick={() => inlineImageFileRef.current?.click()}
            />
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[#5e6058] transition hover:bg-[#efeee6] hover:text-[#31332c]"
              disabled={!editor}
              title="Imagine din URL extern"
              type="button"
              onClick={handleImageUrl}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden text-xs font-bold uppercase tracking-[0.12em] sm:inline">
                URL extern
              </span>
            </button>
            <span className="mx-1 h-6 w-px bg-[#b1b3a9]/35" />
            <ToolbarButton
              disabled={!editor || !editor.can().undo()}
              icon={Undo2}
              label="Undo"
              onClick={() => editor?.chain().focus().undo().run()}
            />
            <ToolbarButton
              disabled={!editor || !editor.can().redo()}
              icon={Redo2}
              label="Redo"
              onClick={() => editor?.chain().focus().redo().run()}
            />
            <input
              ref={inlineImageFileRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={(event) => void handleInlineImageFileChange(event.target.files?.[0])}
            />
          </div>

          <div className={clsx(styles.editor, "rounded-[2rem] border border-[#b1b3a9]/15 bg-white shadow-[0px_12px_32px_rgba(49,51,44,0.05)]")}>
            <EditorContent editor={editor} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <label className="grid gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
              Categorie
              <select
                className="appearance-none rounded-2xl border border-transparent bg-[#efeee6] px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#31332c] outline-none transition focus:border-[#5f5e5e]/25 focus:bg-white"
                defaultValue={post?.categoryId ?? ""}
                name="category_id"
              >
                <option value="">Fara categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <label className="grid gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
              Sumar postare
              <textarea
                className="min-h-32 resize-none rounded-2xl border border-transparent bg-[#efeee6] px-4 py-3 text-sm font-medium normal-case leading-7 tracking-normal text-[#31332c] outline-none transition placeholder:text-[#5e6058]/55 focus:border-[#5f5e5e]/25 focus:bg-white"
                defaultValue={post?.excerpt ?? ""}
                maxLength={360}
                name="excerpt"
                placeholder="Un scurt rezumat al articolului..."
              />
            </label>
          </section>

          <section className="rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <label className="grid gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
              Etichete
              <textarea
                className="min-h-24 resize-none rounded-2xl border border-transparent bg-[#efeee6] px-4 py-3 text-sm font-medium normal-case leading-7 tracking-normal text-[#31332c] outline-none transition placeholder:text-[#5e6058]/55 focus:border-[#5f5e5e]/25 focus:bg-white"
                placeholder="sanatate, echilibru, nutritie"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {tagNames.length ? (
                tagNames.map((tag) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[#f9f3ea] px-3 py-1 text-xs font-bold text-[#5f5b55]"
                    key={tag}
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#5e6058]">Separare prin virgula.</span>
              )}
            </div>
            {allTags.length ? (
              <div className="mt-5 border-t border-[#b1b3a9]/15 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e6058]">
                  Tags existente
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allTags.slice(0, 12).map((tag) => (
                    <button
                      className="rounded-full bg-[#efeee6] px-3 py-1.5 text-xs font-bold text-[#5e6058] transition hover:bg-[#ffdcbd] hover:text-[#654d35]"
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const nextTags = new Set(tagNames);
                        nextTags.add(tag.name);
                        setTagInput([...nextTags].join(", "));
                      }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </form>

      {deleteActionUrl ? (
        <form action={deleteActionUrl} className="mt-8 flex justify-end" method="post">
          <input name="intent" type="hidden" value="delete" />
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[#fff7f6] px-5 py-3 text-sm font-bold text-[#752121] transition hover:bg-[#fe8983]/30"
            type="submit"
          >
            <Trash2 className="h-4 w-4" />
            Sterge articolul
          </button>
        </form>
      ) : null}
    </div>
  );
}
