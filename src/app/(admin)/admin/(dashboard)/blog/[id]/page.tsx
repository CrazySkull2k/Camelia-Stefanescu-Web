import { notFound } from "next/navigation";

import { BlogPostEditor, type BlogEditorPost } from "@/components/admin/blog-post-editor";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EditBlogPostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

type BlogTagRow = {
  blog_tags?:
    | { id: string; name: string; slug: string }
    | Array<{ id: string; name: string; slug: string }>
    | null;
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: EditBlogPostPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = createSupabaseAdminClient();
  const [
    { data: post },
    { data: categories },
    { data: allTags },
    { data: postTagRows },
  ] = await Promise.all([
    supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, content_html, content_json, cover_image_path, status, category_id",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("blog_categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true }),
    supabase.from("blog_tags").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("blog_post_tags").select("blog_tags(id, name, slug)").eq("post_id", id),
  ]);

  if (!post) {
    notFound();
  }

  const tags = ((postTagRows ?? []) as unknown as BlogTagRow[])
    .map((row) => (Array.isArray(row.blog_tags) ? row.blog_tags[0] : row.blog_tags))
    .filter((tag): tag is { id: string; name: string; slug: string } => Boolean(tag));

  const editorPost: BlogEditorPost = {
    categoryId: post.category_id,
    contentHtml: post.content_html,
    contentJson: post.content_json,
    coverImagePath: post.cover_image_path,
    excerpt: post.excerpt,
    id: post.id,
    slug: post.slug,
    status: post.status,
    tags,
    title: post.title,
  };
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <BlogPostEditor
      actionUrl={`/api/admin/blog/${id}`}
      allTags={allTags ?? []}
      categories={categories ?? []}
      deleteActionUrl={`/api/admin/blog/${id}`}
      feedback={
        error
          ? { tone: "error", value: error }
          : status
            ? {
                tone: "success",
                value:
                  status === "created"
                    ? "Articolul a fost creat."
                    : status === "updated"
                      ? "Articolul a fost actualizat."
                      : "Modificarile au fost procesate.",
              }
            : null
      }
      mode="edit"
      post={editorPost}
      previewHref={`/admin/blog/${id}/preview`}
    />
  );
}
