import { notFound } from "next/navigation";

import { PageContentEditor } from "@/components/admin/page-content-editor";
import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { getAdminPageEditorState } from "@/modules/cms/service";

type EditContentPageProps = {
  params: Promise<{ pageKey: string }>;
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

export default async function EditContentPage({
  params,
  searchParams,
}: EditContentPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const [{ pageKey }, query] = await Promise.all([params, searchParams]);
  const state = await getAdminPageEditorState(pageKey);
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const status = Array.isArray(query.status) ? query.status[0] : query.status;

  if (!state) {
    notFound();
  }

  return (
    <PageContentEditor
      actionUrl={`/api/admin/content/${pageKey}`}
      definition={state.definition}
      error={error ?? null}
      hasDraft={state.hasDraft}
      hasPublished={state.hasPublished}
      initialContent={state.editContent}
      status={status}
    />
  );
}
