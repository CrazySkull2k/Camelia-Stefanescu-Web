import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardList,
  Download,
  FileCheck2,
  FlaskConical,
  UploadCloud,
} from "lucide-react";

import {
  analysisUploadGroups,
  requiredAnalyses,
  specificAnalyses,
} from "@/content/patient-portal-content";
import { getCurrentPatientAccount } from "@/modules/patients/account";
import { listPatientAnalysisUploads } from "@/modules/patients/analyses";

import { AnalysisUploadPanel } from "./analysis-upload-panel";

type PatientAnalysesPageProps = {
  searchParams: Promise<{
    tab?: string;
    category?: string;
    uploaded?: string;
    error?: string;
  }>;
};

function TabLink({
  active,
  href,
  icon,
  title,
  description,
}: {
  active: boolean;
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      className={`rounded-[1.5rem] border px-5 py-4 transition ${
        active
          ? "border-[#f0cfb0] bg-[#ffdcbd] text-[#513b25] shadow-[0px_12px_24px_rgba(101,77,53,0.08)]"
          : "border-[#b1b3a9]/10 bg-white text-[#31332c] hover:bg-[#fff7f3]"
      }`}
      href={href}
    >
      <span className="flex items-start justify-between gap-4">
        <span>
          <span className="block font-serif text-2xl italic">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-[#5e6058]">
            {description}
          </span>
        </span>
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full transition ${
            active
              ? "bg-white/70 text-[#654d35]"
              : "bg-[#f5f4ed] text-[#5f5e5e]"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </span>
    </Link>
  );
}

function AnalysesList() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Necesare personalizarii recomandarilor
            </p>
            <h2 className="mt-1 font-serif text-3xl text-[#31332c]">
              Analize obligatorii
            </h2>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {requiredAnalyses.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] bg-[#f5f4ed] px-5 py-4"
            >
              <div
                className={`flex gap-4 ${
                  item.details.length
                    ? "items-start"
                    : "items-center"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-serif text-lg italic leading-none text-[#5f5e5e]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#31332c]">
                    {item.title}
                  </h3>
                  {item.details.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[#5e6058]">
                      {item.details.map((detail) => (
                        <li key={detail} className="flex gap-3">
                          <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[#735a42]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f9f3ea] text-[#6f573e]">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Pentru anumite afectiuni
            </p>
            <h2 className="mt-1 font-serif text-3xl text-[#31332c]">
              Analize specifice
            </h2>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {specificAnalyses.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-[#b1b3a9]/10 bg-[#fbf9f4] px-5 py-4"
            >
              <h3 className="text-base font-semibold text-[#31332c]">
                {item.title}
              </h3>
              {item.description ? (
                <p className="mt-1 text-sm leading-7 text-[#735a42]">
                  {item.description}
                </p>
              ) : null}
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[#5e6058]">
                {item.details.map((detail) => (
                  <li key={detail} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[#735a42]" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function PatientAnalysesPage({
  searchParams,
}: PatientAnalysesPageProps) {
  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    redirect("/cont/autentificare?redirectTo=/cont/analize");
  }

  const params = await searchParams;
  const activeTab = params.tab === "incarcare" ? "incarcare" : "lista";
  const uploads = await listPatientAnalysisUploads(patient.id).catch(() => []);

  return (
    <section className="space-y-8">
      <header className="rounded-[2.25rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
          Analize
        </p>
        <h1 className="mt-4 font-serif text-5xl text-[#31332c]">
          Analize pentru consult
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5e6058]">
          Consulta lista analizelor necesare si incarca rezultatele pe
          categorii, ca medicul sa le poata verifica inainte de consult.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#252c28] px-6 py-3 text-sm font-semibold !text-white transition hover:bg-[#1d221f]"
            download
            href="/site/theme/assets/docs/Analize obligatorii si optionale.pdf"
          >
            <Download className="h-4 w-4 !text-white" />
            Descarca PDF-ul cu analize
          </a>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-[#fff7f3] px-6 py-3 text-sm font-semibold text-[#654d35] transition hover:bg-[#ffeedf]"
            href="/cont/support"
          >
            Cere suport pentru pregatire
          </Link>
        </div>
      </header>

      <nav className="grid gap-4 md:grid-cols-2">
        <TabLink
          active={activeTab === "lista"}
          description="Vezi setul recomandat pentru prima consultatie."
          href="/cont/analize"
          icon={<ClipboardList className="h-5 w-5" />}
          title="Lista analize necesare"
        />
        <TabLink
          active={activeTab === "incarcare"}
          description="Incarca rezultatele primite de la laborator."
          href="/cont/analize?tab=incarcare"
          icon={<UploadCloud className="h-5 w-5" />}
          title="Incarcare analize"
        />
      </nav>

      {activeTab === "incarcare" ? (
        <AnalysisUploadPanel
          error={params.error}
          groups={analysisUploadGroups}
          initialCategoryKey={params.category}
          uploaded={params.uploaded}
          uploads={uploads}
        />
      ) : (
        <AnalysesList />
      )}
    </section>
  );
}
