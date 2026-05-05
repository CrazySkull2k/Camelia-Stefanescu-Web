import Link from "next/link";
import { FilePenLine, Plus, Tag } from "lucide-react";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/dates";

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

function StatusBadge({ status }: { status?: string | null }) {
  const published = status === "published";

  return (
    <span
      className={
        published
          ? "inline-flex rounded-full bg-[#f9f3ea] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#5f5b55]"
          : "inline-flex rounded-full bg-[#ffdcbd] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#654d35]"
      }
    >
      {published ? "Publicat" : "Ciorna"}
    </span>
  );
}

export default async function AdminBlogPage() {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const supabase = createSupabaseAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, status, published_at, updated_at, excerpt, blog_categories(name), blog_post_tags(blog_tags(name, slug))",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  const publishedCount = posts?.filter((post) => post.status === "published").length ?? 0;
  const draftCount = (posts?.length ?? 0) - publishedCount;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-[#b1b3a9]/15 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
            Administrare continut
          </span>
          <h1 className="mt-3 font-serif text-5xl leading-none text-[#31332c]">
            Blog editorial
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e6058]">
            Ciorne, articole publicate, categorii si tags reale pentru biblioteca de
            continut medical si wellness.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-[#f5f4ed] px-5 py-3 text-center">
            <p className="font-serif text-3xl leading-none text-[#31332c]">{publishedCount}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5e6058]">
              Publicate
            </p>
          </div>
          <div className="rounded-2xl bg-[#ffdcbd] px-5 py-3 text-center">
            <p className="font-serif text-3xl leading-none text-[#654d35]">{draftCount}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#654d35]">
              Ciorne
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-6 py-3 text-sm font-bold text-[#faf7f6] transition hover:bg-[#535252]"
            href="/admin/blog/new"
          >
            <Plus className="h-4 w-4" />
            Articol nou
          </Link>
        </div>
      </header>

      <div className="grid gap-4">
        {posts?.length ? (
          posts.map((post) => {
            const tags = getTags(post.blog_post_tags);

            return (
              <article
                className="group rounded-[1.75rem] border border-[#b1b3a9]/12 bg-white p-5 shadow-[0px_12px_32px_rgba(49,51,44,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0px_18px_42px_rgba(49,51,44,0.08)]"
                key={post.id}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={post.status} />
                      {getCategoryName(post.blog_categories) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#efeee6] px-3 py-1 text-xs font-bold text-[#5e6058]">
                          <Tag className="h-3 w-3" />
                          {getCategoryName(post.blog_categories)}
                        </span>
                      ) : null}
                      <span className="text-xs font-semibold text-[#5e6058]">
                        Actualizat: {formatDateTime(post.updated_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 truncate font-serif text-3xl leading-tight text-[#31332c]">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-[#5e6058]">
                        {post.excerpt}
                      </p>
                    ) : null}
                    {tags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.slice(0, 5).map((tag) => (
                          <span
                            className="rounded-full bg-[#f9f3ea] px-3 py-1 text-xs font-bold text-[#5f5b55]"
                            key={tag.slug}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {post.status === "published" ? (
                      <Link
                        className="rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-bold text-[#31332c] transition hover:bg-[#efeee6]"
                        href={`/blog/${post.slug}`}
                        target="_blank"
                      >
                        Vezi public
                      </Link>
                    ) : null}
                    <Link
                      className="inline-flex items-center gap-2 rounded-full bg-[#31332c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#535252]"
                      href={`/admin/blog/${post.id}`}
                    >
                      <FilePenLine className="h-4 w-4" />
                      Editeaza
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[#b1b3a9]/45 bg-white p-10 text-center">
            <p className="font-serif text-3xl text-[#31332c]">Nu exista articole inca.</p>
            <p className="mt-2 text-sm text-[#5e6058]">
              Creeaza primul draft pentru biblioteca editoriala.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
