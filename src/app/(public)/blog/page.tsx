import { BlogIndex } from "@/components/site/blog-index";
import { getBlogPosts } from "@/modules/blog/service";

type BlogPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const posts = await getBlogPosts({
    search: params.search,
    category: params.category,
  });

  return <BlogIndex posts={posts} search={params.search} />;
}
