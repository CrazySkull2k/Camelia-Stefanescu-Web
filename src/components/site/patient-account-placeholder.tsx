import Link from "next/link";

type PatientAccountPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PatientAccountPlaceholder({
  eyebrow,
  title,
  description,
}: PatientAccountPlaceholderProps) {
  return (
    <section className="rounded-[2.25rem] border border-[#b1b3a9]/10 bg-[#f5f4ed] p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] sm:p-10">
      <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#797c73]">
        {eyebrow}
      </span>
      <h1 className="mt-4 font-serif text-4xl text-[#31332c] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-[#5e6058]">
        {description}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[2rem] border border-white/70 bg-white p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#735a42]">
            In curand
          </p>
          <h2 className="mt-3 font-serif text-3xl text-[#31332c]">
            Zona este pregatita pentru pasul urmator
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#5e6058]">
            Pastram navigatia si stilul noului panou pacient, dar continutul
            complet pentru aceasta sectiune va fi activat intr-o etapa viitoare.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#f9f3ea] p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6f573e]">
            Intre timp
          </p>
          <div className="mt-5 grid gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-[#5f5e5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#535252]"
              href="/cont/dashboard"
            >
              Inapoi la panou
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/30 bg-white px-5 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
              href="/programare"
            >
              Rezerva o consultatie
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
