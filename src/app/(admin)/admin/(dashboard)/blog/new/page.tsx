import { BlogPostEditor } from "@/components/admin/blog-post-editor";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NewBlogPostPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

export default async function NewBlogPostPage({ searchParams }: NewBlogPostPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const query = await searchParams;
  const supabase = createSupabaseAdminClient();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase
      .from("blog_categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true }),
    supabase.from("blog_tags").select("id, name, slug").order("name", { ascending: true }),
  ]);
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <BlogPostEditor
      actionUrl="/api/admin/blog"
      allTags={tags ?? []}
      categories={categories ?? []}
      feedback={
        error
          ? { tone: "error", value: error }
          : status
            ? { tone: "success", value: "Articolul a fost procesat." }
            : null
      }
      mode="create"
    />
  );
}
