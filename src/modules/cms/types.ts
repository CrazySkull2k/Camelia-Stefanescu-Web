export type CmsPageContent = {
  pageKey: string;
  title: string;
  source: "supabase" | "legacy";
  html: string;
};
