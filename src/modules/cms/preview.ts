export type CmsPreviewSearchParams = {
  cms_preview?: string | string[];
  previewed_page?: string | string[];
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function shouldUseCmsDraftPreview(
  searchParams: CmsPreviewSearchParams,
  pageKey: string,
) {
  return (
    getFirstParam(searchParams.cms_preview) === "1" &&
    getFirstParam(searchParams.previewed_page) === pageKey
  );
}
