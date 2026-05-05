import { notFound } from "next/navigation";

import { BlogPostView } from "@/components/site/blog-post";
import { getBlogPostBySlug } from "@/modules/blog/service";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
}
