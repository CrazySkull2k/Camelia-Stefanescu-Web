import Link from "next/link";
import { CircleHelp, Mail, MessageCircleMore, Phone } from "lucide-react";

import { siteContact } from "@/content/site-content";
import { supportTopics } from "@/content/patient-portal-content";

export default function PatientSupportPage() {
  return (
    <section className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
      <div className="space-y-8">
        <header className="rounded-[2.25rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#797c73]">
            Support
          </p>
          <h1 className="mt-4 font-serif text-5xl text-[#31332c]">
            Cere support direct din cont
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#5e6058]">
            Daca ai nevoie de clarificari despre programari, evaluarea
            nutritionala, analizele necesare sau datele din profil, poti porni
            de aici si alegi rapid canalul potrivit.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <a
            className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fff7f3]"
            href={`tel:${siteContact.phone.replace(/\s+/g, "")}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
              <Phone className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Telefon
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#31332c]">
              {siteContact.phone}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5e6058]">
              Cel mai rapid canal pentru reprogramari si intrebari despre
              consult.
            </p>
          </a>

          <a
            className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fff7f3]"
            href={`mailto:${siteContact.email}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f9f3ea] text-[#6f573e]">
              <Mail className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Email
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#31332c]">
              Scrie-ne
            </h2>
            <p className="mt-3 break-words text-sm leading-7 text-[#5e6058]">
              {siteContact.email}
            </p>
          </a>

          <a
            className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fff7f3]"
            href={`https://wa.me/4${siteContact.whatsapp.replace(/\s+/g, "")}`}
            rel="noreferrer"
            target="_blank"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e4f5ea] text-[#2f7d4f]">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              WhatsApp
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#31332c]">
              Mesaj rapid
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5e6058]">
              Pentru update-uri scurte si coordonare rapida inainte de consult.
            </p>
          </a>
        </div>

        <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efeee6] text-[#5f5e5e]">
              <CircleHelp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                Te putem ajuta cu
              </p>
              <h2 className="mt-1 font-serif text-3xl text-[#31332c]">
                Tipuri de solicitari
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {supportTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-[1.5rem] bg-[#f5f4ed] px-5 py-4 text-sm font-semibold text-[#31332c]"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#f9f3ea] p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
            Recomandare
          </p>
          <h3 className="mt-3 font-serif text-3xl text-[#31332c]">
            Incepe cu suportul potrivit
          </h3>
          <p className="mt-4 text-sm leading-7 text-[#5e6058]">
            Pentru intrebari despre analize si pregatirea pentru consultatie,
            deschide mai intai sectiunea de analize si revino aici daca vrei
            ajutor suplimentar.
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#252c28] px-5 py-3 text-sm font-semibold !text-white transition hover:bg-[#1d221f]"
            href="/cont/analize"
          >
            Vezi analizele necesare
          </Link>
        </div>

        <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
            Alternativ
          </p>
          <div className="mt-5 grid gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-5 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
              href="/contact"
            >
              Deschide pagina de contact
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#b1b3a9]/20 bg-white px-5 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3]"
              href="/cont/dashboard"
            >
              Inapoi la panoul pacientului
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}
