import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug";
import { sanitizeRichHtml } from "@/lib/validation/html";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { writeAuditLog } from "@/modules/audit/service";
import {
  EMPTY_TIPTAP_DOC,
  type BlogEditorJson,
  isTiptapDocument,
} from "@/modules/blog/editor-content";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type BlogPostPayload = {
  categoryId: string | null;
  contentHtml: string;
  contentJson: BlogEditorJson;
  coverImagePath: string | null;
  excerpt: string | null;
  slug: string;
  status: "draft" | "published";
  tagNames: string[];
  title: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseStatus(formData: FormData): "draft" | "published" {
  const intent = getString(formData, "intent");
  if (intent === "published") {
    return "published";
  }

  if (intent === "draft") {
    return "draft";
  }

  const status = getString(formData, "status");
  return status === "published" ? "published" : "draft";
}

function parseContentJson(value: string): BlogEditorJson {
  if (!value) {
    return EMPTY_TIPTAP_DOC;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isTiptapDocument(parsed) ? parsed : EMPTY_TIPTAP_DOC;
  } catch {
    return EMPTY_TIPTAP_DOC;
  }
}

function parseTagNames(value: string) {
  const unique = new Map<string, string>();

  value
    .split(/[,\n]/)
    .map((tag) => sanitizePlainText(tag).replace(/^#+/, "").trim())
    .filter(Boolean)
    .slice(0, 24)
    .forEach((tag) => {
      const slug = slugify(tag);
      if (slug) {
        unique.set(slug, tag.slice(0, 48));
      }
    });

  return [...unique.values()];
}

function buildPayload(formData: FormData): BlogPostPayload {
  const title = sanitizePlainText(getString(formData, "title")).slice(0, 180);
  if (!title) {
    throw new Error("Titlul articolului este obligatoriu.");
  }

  const requestedSlug = slugify(getString(formData, "slug") || title);
  const slug = requestedSlug || `articol-${Date.now()}`;
  const excerpt = sanitizePlainText(getString(formData, "excerpt")).slice(0, 360);
  const categoryId = sanitizePlainText(getString(formData, "category_id"));
  const coverImagePath = sanitizePlainText(getString(formData, "cover_image_path"));
  const contentHtml = sanitizeRichHtml(getString(formData, "content_html"));
  const contentJson = parseContentJson(getString(formData, "content_json"));

  return {
    categoryId: categoryId || null,
    contentHtml,
    contentJson,
    coverImagePath: coverImagePath || null,
    excerpt: excerpt || null,
    slug,
    status: parseStatus(formData),
    tagNames: parseTagNames(getString(formData, "tags")),
    title,
  };
}

async function getUniqueSlug(
  supabase: SupabaseAdminClient,
  baseSlug: string,
  currentPostId?: string,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === currentPostId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function syncPostTags(
  supabase: SupabaseAdminClient,
  postId: string,
  tagNames: string[],
) {
  await supabase.from("blog_post_tags").delete().eq("post_id", postId);

  if (!tagNames.length) {
    return;
  }

  const tagIds: string[] = [];

  for (const name of tagNames) {
    const slug = slugify(name);
    if (!slug) {
      continue;
    }

    const { data, error } = await supabase
      .from("blog_tags")
      .upsert(
        {
          name,
          slug,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.id) {
      tagIds.push(String(data.id));
    }
  }

  if (!tagIds.length) {
    return;
  }

  const { error } = await supabase.from("blog_post_tags").insert(
    tagIds.map((tagId) => ({
      post_id: postId,
      tag_id: tagId,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createBlogPostMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const supabase = createSupabaseAdminClient();
  const payload = buildPayload(input.formData);
  const slug = await getUniqueSlug(supabase, payload.slug);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      category_id: payload.categoryId,
      content_html: payload.contentHtml,
      content_json: payload.contentJson,
      cover_image_path: payload.coverImagePath,
      excerpt: payload.excerpt,
      published_at: payload.status === "published" ? now : null,
      slug,
      status: payload.status,
      title: payload.title,
      updated_at: now,
    })
    .select("id, slug")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Nu am putut crea articolul.");
  }

  await syncPostTags(supabase, String(data.id), payload.tagNames);
  await writeAuditLog({
    action: "blog-post-created",
    actorId: input.actorId,
    after: {
      slug: data.slug,
      status: payload.status,
      title: payload.title,
    },
    entityId: String(data.id),
    entityType: "blog_post",
  });

  return { id: String(data.id), slug: data.slug };
}

export async function updateBlogPostMutation(input: {
  actorId: string;
  formData: FormData;
  postId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const payload = buildPayload(input.formData);
  const { data: currentPost, error: currentError } = await supabase
    .from("blog_posts")
    .select("id, slug, published_at, status, title")
    .eq("id", input.postId)
    .single();

  if (currentError || !currentPost) {
    throw new Error(currentError?.message ?? "Articolul nu a fost gasit.");
  }

  const slug = await getUniqueSlug(supabase, payload.slug, input.postId);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("blog_posts")
    .update({
      category_id: payload.categoryId,
      content_html: payload.contentHtml,
      content_json: payload.contentJson,
      cover_image_path: payload.coverImagePath,
      excerpt: payload.excerpt,
      published_at: payload.status === "published" ? currentPost.published_at ?? now : null,
      slug,
      status: payload.status,
      title: payload.title,
      updated_at: now,
    })
    .eq("id", input.postId);

  if (error) {
    throw new Error(error.message);
  }

  await syncPostTags(supabase, input.postId, payload.tagNames);
  await writeAuditLog({
    action: "blog-post-updated",
    actorId: input.actorId,
    before: {
      slug: currentPost.slug,
      status: currentPost.status,
      title: currentPost.title,
    },
    after: {
      slug,
      status: payload.status,
      title: payload.title,
    },
    entityId: input.postId,
    entityType: "blog_post",
  });

  return { slug, previousSlug: currentPost.slug };
}

export async function deleteBlogPostMutation(input: {
  actorId: string;
  postId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: currentPost } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .eq("id", input.postId)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", input.postId);
  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog({
    action: "blog-post-deleted",
    actorId: input.actorId,
    before: {
      slug: currentPost?.slug ?? null,
      title: currentPost?.title ?? null,
    },
    entityId: input.postId,
    entityType: "blog_post",
  });

  return { slug: currentPost?.slug ?? null };
}
