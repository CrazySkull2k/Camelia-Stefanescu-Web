import Link from "next/link";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { formatDateTime } from "@/lib/utils/dates";
import { getAdminContentOverview } from "@/modules/cms/service";

export default async function ContentPage() {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const pages = await getAdminContentOverview();

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#735a42]">
          Continut public
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[#31332c]">Editor de pagini</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5e6058]">
          Editeaza texte, imagini si accente vizuale presetate. Modificarile se
          salveaza ca draft si devin vizibile public doar dupa publicare.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pages.map(({ definition, hasDraft, hasPublished, updatedAt }) => (
          <article className="admin-card flex flex-col p-5" key={definition.pageKey}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#735a42]">
                  {definition.route}
                </p>
                <h2 className="mt-2 font-serif text-3xl text-[#31332c]">
                  {definition.label}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  hasDraft
                    ? "bg-[#ffdcbd] text-[#654d35]"
                    : hasPublished
                      ? "bg-[#e8e9e0] text-[#4c4943]"
                      : "bg-[#fff7f6] text-[#752121]"
                }`}
              >
                {hasDraft ? "Draft" : hasPublished ? "Publicat" : "Nepublicat"}
              </span>
            </div>

            <p className="mt-4 text-sm text-[#5e6058]">
              {updatedAt ? `Ultima actualizare: ${formatDateTime(updatedAt)}` : "Fara editari CMS."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="admin-cta-primary rounded-full bg-[#31332c] px-5 py-3 text-sm font-bold !text-[#fff7f3] transition hover:bg-[#0e0e0c]"
                href={`/admin/content/${definition.pageKey}`}
              >
                Deschide editorul
              </Link>
              <Link
                className="rounded-full border border-[#d8d5cc] px-5 py-3 text-sm font-bold text-[#31332c] transition hover:bg-[#f5f4ed]"
                href={definition.route}
                target="_blank"
              >
                Vezi pagina
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
