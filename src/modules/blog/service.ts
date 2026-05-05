import "server-only";

import { hasServerEnv } from "@/lib/env/server";
import { resolvePublicMediaUrl } from "@/lib/media";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRichHtml } from "@/lib/validation/html";
import { getLegacyBlogData } from "@/modules/blog/legacy";
import type { BlogPost } from "@/modules/blog/types";

function getCategoryName(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return typeof first?.name === "string" ? first.name : null;
  }

  if (typeof value === "object" && value !== null && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }

  return null;
}

function getTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const tag = (row as { blog_tags?: unknown }).blog_tags;
      const tagObject = Array.isArray(tag) ? tag[0] : tag;

      if (typeof tagObject !== "object" || tagObject === null) {
        return null;
      }

      const { name, slug } = tagObject as { name?: unknown; slug?: unknown };
      if (typeof name !== "string" || typeof slug !== "string") {
        return null;
      }

      return { name, slug };
    })
    .filter((tag): tag is { name: string; slug: string } => Boolean(tag));
}

export async function getBlogPosts(options?: {
  search?: string;
  category?: string;
}): Promise<BlogPost[]> {
  if (!hasServerEnv()) {
    const legacy = await getLegacyBlogData();

    return legacy.posts.filter((post) => {
      const matchesSearch = options?.search
        ? [post.title, post.excerpt, post.contentHtml]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(options.search!.toLowerCase()),
            )
        : true;
      const matchesCategory = options?.category
        ? post.categoryId === options.category ||
          post.categoryName?.toLowerCase() === options.category.toLowerCase()
        : true;

      return matchesSearch && matchesCategory;
    }).map((post) => ({
      ...post,
      contentHtml: sanitizeRichHtml(post.contentHtml),
    }));
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, content_html, published_at, cover_image_path, blog_categories(name), blog_post_tags(blog_tags(name, slug))",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`,
    );
  }

  const { data } = await query;

  if (!data?.length) {
    return [];
  }

  return data.map((post) => ({
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentHtml: sanitizeRichHtml(post.content_html ?? ""),
    image: resolvePublicMediaUrl(post.cover_image_path),
    categoryName: getCategoryName(post.blog_categories),
    createdAt: post.published_at ?? new Date().toISOString(),
    tags: getTags(post.blog_post_tags),
  }));
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
