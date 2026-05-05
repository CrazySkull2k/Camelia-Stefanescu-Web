import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostView } from "@/components/site/blog-post";
import { SetupNotice } from "@/components/admin/setup-notice";
import styles from "@/components/admin/blog-post-editor.module.css";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeRichHtml } from "@/lib/validation/html";
import type { BlogPost } from "@/modules/blog/types";

type BlogPostPreviewPageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function BlogPostPreviewPage({ params }: BlogPostPreviewPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, content_html, cover_image_path, published_at, updated_at, created_at, blog_categories(name)",
    )
    .eq("id", id)
    .single();

  if (!post) {
    notFound();
  }

  const previewPost: BlogPost = {
    categoryName: getCategoryName(post.blog_categories),
    contentHtml: sanitizeRichHtml(post.content_html ?? ""),
    createdAt: post.published_at ?? post.updated_at ?? post.created_at,
    excerpt: post.excerpt,
    id: post.id,
    image: post.cover_image_path,
    slug: post.slug,
    title: post.title,
  };

  return (
    <div className={styles.articlePreview}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#b1b3a9]/15 bg-white px-5 py-4 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#735a42]">
            Preview protejat
          </p>
          <p className="mt-1 text-sm text-[#5e6058]">
            Aceasta pagina nu publica draftul si este disponibila doar in admin.
          </p>
        </div>
        <Link
          className="admin-cta-primary rounded-full bg-[#31332c] px-5 py-3 text-sm font-bold !text-[#fff7f3] shadow-[0px_12px_28px_rgba(49,51,44,0.16)] transition hover:bg-[#0e0e0c] hover:!text-[#fff7f3] focus-visible:!text-[#fff7f3]"
          href={`/admin/blog/${id}`}
        >
          Inapoi la editare
        </Link>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-[#b1b3a9]/15 bg-white shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <BlogPostView post={previewPost} />
      </div>
    </div>
  );
}
