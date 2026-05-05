import { PageHero } from "@/components/site/page-hero";
import { gdprSections, termsRules } from "@/content/site-content";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Termeni si GDPR"
        title="Conditiile de lucru, plata si protectia datelor explicate clar."
        description="Aceasta pagina reuneste regulile de colaborare si informatiile esentiale privind prelucrarea datelor personale."
        trail={[
          { href: "/", label: "Acasa" },
          { label: "Termeni si GDPR" },
        ]}
      />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Reguli de lucru
          </p>
          <ul className="mt-6 space-y-4">
            {termsRules.map((rule) => (
              <li
                key={rule}
                className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600"
              >
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          {gdprSections.map((section) => {
            const bullets =
              "bullets" in section && Array.isArray(section.bullets)
                ? section.bullets
                : [];

            return (
              <article
                key={section.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
              >
                <h2 className="text-2xl font-semibold text-slate-950">
                  {section.title}
                </h2>
                {"body" in section && section.body ? (
                  <p className="mt-4 text-sm leading-7 text-slate-600">{section.body}</p>
                ) : null}
                {bullets.length ? (
                  <ul className="mt-5 space-y-3">
                    {bullets.map((bullet) => (
                      <li
                        key={String(bullet)}
                        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600"
                      >
                        {String(bullet)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
