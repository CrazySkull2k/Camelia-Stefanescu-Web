export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
  excerpt?: string | null;
  contentHtml: string;
  categoryId?: string | null;
  categoryName?: string | null;
  createdAt: string;
  tags?: Array<{
    name: string;
    slug: string;
  }>;
};
