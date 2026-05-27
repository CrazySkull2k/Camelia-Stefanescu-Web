/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import clsx from "clsx";

import styles from "./home-exact-design-page.module.css";

export function HomeExactDesignPage() {
  return (
    <div
      className={clsx(styles.root, "bg-surface text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container")}
      data-design-page="home"
      data-cms-override-version="home-2026-design-v2"
    >
      <div>
        <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 px-6 md:px-12 max-w-screen-2xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7 z-10 flex flex-col justify-center order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-full w-max mb-8 ghost-border">
                <span className="material-symbols-outlined text-sm">spa</span>
                <span className="font-label text-[0.6875rem] uppercase tracking-[0.05em] font-semibold">Sanctuarul tău de bine</span>
              </div>
              <h1 className="font-headline text-5xl md:text-7xl lg:text-[5rem] leading-[1.1] text-on-surface mb-8 tracking-tight font-light">
                 Dr. Camelia Stefanescu 
                <div className="mt-6 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="h-[1px] w-4 bg-secondary mt-3 opacity-40"></div>
                    <p className="font-body text-base md:text-lg text-secondary leading-relaxed tracking-wide italic">Medic, medicina generala - licenta UMF Bucuresti</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-[1px] w-4 bg-secondary mt-3 opacity-40"></div>
                    <p className="font-body text-base md:text-lg text-secondary leading-relaxed tracking-wide italic">Nutritionist-dietetician - licenta UMF Tg. Mures</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-[1px] w-4 bg-secondary mt-3 opacity-40"></div>
                    <p className="font-body text-base md:text-lg text-secondary leading-relaxed tracking-wide italic">Master Stiintele Nutritiei - UBB Cluj-Napoca</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-[1px] w-4 bg-secondary mt-3 opacity-40"></div>
                    <p className="font-body text-base md:text-lg text-secondary leading-relaxed tracking-wide italic">Specialist Diagnoza Celulara - Global Diagnostics Austria</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-[1px] w-4 bg-secondary mt-3 opacity-40"></div>
                    <p className="font-body text-base md:text-lg text-secondary leading-relaxed tracking-wide italic">Specialist terapii shockwave - AUVA Meidling Center Viena</p>
                  </div>
                </div>
              </h1>
              <p className="font-body text-body-md text-on-surface-variant max-w-xl mb-12 leading-relaxed text-lg">O abordare integrativă pentru sănătatea ta, combinând expertiza medicală cu soluții personalizate pentru un echilibru durabil.</p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button className="bg-primary hover:bg-primary-dim text-on-primary font-body text-sm font-medium tracking-wide px-8 py-4 rounded-full transition-colors duration-300 w-full sm:w-auto text-center relative overflow-hidden group">
                  <span className="relative z-10">Programează o consultație</span>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary-container/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
                <button className="bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-sm font-medium tracking-wide px-8 py-4 rounded-full transition-colors duration-300 w-full sm:w-auto text-center">Află mai multe</button>
              </div>
            </div>
            <div className="lg:col-span-5 relative order-1 lg:order-2">
              <div className="aspect-[3/4] rounded-t-[12rem] rounded-b-xl overflow-hidden box-shadow-ambient relative group">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Dr. Camelia Stefanescu" data-alt="Professional, warm portrait of a blonde female doctor in an orange jacket with arms crossed, against a deep teal background." src="/site/home/acasa.png" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/40 to-transparent mix-blend-overlay"></div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-2xl box-shadow-ambient hidden md:block ghost-border z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container"><span className="material-symbols-outlined">health_and_safety</span></div>
                  <div>
                    <p className="font-body text-label-sm uppercase tracking-[0.05em] text-on-surface-variant">Certificare</p>
                    <p className="font-headline text-title-lg text-on-surface">Medicală</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 px-6 md:px-12 max-w-screen-2xl mx-auto">
          <div className="bg-surface-container-low rounded-[2rem] p-8 md:p-12 box-shadow-ambient ghost-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
              <div className="hidden md:block absolute top-1/2 left-1/3 w-[1px] h-2/3 -translate-y-1/2 bg-outline-variant/20"></div>
              <div className="hidden md:block absolute top-1/2 right-1/3 w-[1px] h-2/3 -translate-y-1/2 bg-outline-variant/20"></div>
              <div className="flex flex-col items-center text-center group px-8">
                <div className="font-headline text-[4rem] md:text-[5rem] text-primary leading-none mb-4 font-light group-hover:text-secondary transition-colors duration-500 tracking-tight">
                  20
                  <span className="text-[3rem] align-top text-secondary/60">+</span>
                </div>
                <p className="font-body text-label-md uppercase tracking-[0.1em] text-on-surface-variant font-medium">ani de experienta</p>
              </div>
              <div className="flex flex-col items-center text-center group px-8 border-t border-outline-variant/20 pt-8 md:border-none md:pt-0">
                <div className="font-headline text-[4rem] md:text-[5rem] text-primary leading-none mb-4 font-light group-hover:text-secondary transition-colors duration-500 tracking-tight">
                  840
                  <span className="text-[3rem] align-top text-secondary/60">+</span>
                </div>
                <p className="font-body text-label-md uppercase tracking-[0.1em] text-on-surface-variant font-medium">pacienti ajutati</p>
              </div>
              <div className="flex flex-col items-center text-center group px-8 border-t border-outline-variant/20 pt-8 md:border-none md:pt-0">
                <div className="font-headline text-[4rem] md:text-[5rem] text-primary leading-none mb-4 font-light group-hover:text-secondary transition-colors duration-500 tracking-tight">
                  98
                  <span className="text-[3rem] align-top text-secondary/60">%</span>
                </div>
                <p className="font-body text-label-md uppercase tracking-[0.1em] text-on-surface-variant font-medium">clienti multumiti</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 px-6 md:px-12 max-w-screen-2xl mx-auto bg-surface-container-low rounded-[3rem] my-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-body text-label-sm uppercase tracking-[0.05em] text-on-surface-variant block mb-4">Expertiză</span>
            <h2 className="font-headline text-headline-md md:text-5xl text-on-surface mb-6">Servicii Personalizate</h2>
            <p className="font-body text-body-md text-on-surface-variant text-lg">Abordăm sănătatea din mai multe unghiuri pentru a oferi soluții complete și eficiente, adaptate nevoilor tale unice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest rounded-3xl p-10 box-shadow-ambient ghost-border group hover:bg-surface-bright transition-colors duration-300 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-8"><span className="material-symbols-outlined text-3xl designInline1">biotech</span></div>
              <h3 className="font-headline text-title-lg text-on-surface mb-4">Diagnostic Celular</h3>
              <p className="font-body text-body-md text-on-surface-variant flex-grow mb-8">Analiză profundă la nivel celular pentru a înțelege cauzele fundamentale ale dezechilibrelor din organismul tău.</p>
              <a className="font-body text-sm font-medium text-secondary hover:text-secondary-dim flex items-center gap-2 transition-colors" href="#">
                 Descoperă 
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl p-10 box-shadow-ambient ghost-border group hover:bg-surface-bright transition-colors duration-300 flex flex-col h-full transform md:-translate-y-8">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-8"><span className="material-symbols-outlined text-3xl designInline2">nutrition</span></div>
              <h3 className="font-headline text-title-lg text-on-surface mb-4">Nutriție</h3>
              <p className="font-body text-body-md text-on-surface-variant flex-grow mb-8">Planuri alimentare personalizate create de un medic nutriționist-dietetician pentru a susține vindecarea și vitalitatea.</p>
              <a className="font-body text-sm font-medium text-secondary hover:text-secondary-dim flex items-center gap-2 transition-colors" href="#">
                 Descoperă 
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl p-10 box-shadow-ambient ghost-border group hover:bg-surface-bright transition-colors duration-300 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface flex items-center justify-center mb-8"><span className="material-symbols-outlined text-3xl designInline3">waves</span></div>
              <h3 className="font-headline text-title-lg text-on-surface mb-4">Shockwave</h3>
              <p className="font-body text-body-md text-on-surface-variant flex-grow mb-8">Terapie modernă non-invazivă pentru reducerea durerii și stimularea procesului natural de vindecare a țesuturilor.</p>
              <a className="font-body text-sm font-medium text-secondary hover:text-secondary-dim flex items-center gap-2 transition-colors" href="#">
                 Descoperă 
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>
            </div>
          </div>
        </section>
        <section className="py-24 px-6 md:px-12 max-w-screen-2xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-secondary-container/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="font-headline text-headline-md md:text-5xl text-on-surface mb-6">Afla parerea celor care au facut o schimbare</h2>
            <div className="h-[1px] w-24 bg-outline-variant/30 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-bright/80 backdrop-blur-[24px] rounded-3xl p-8 box-shadow-ambient ghost-border flex flex-col relative">
              <div className="flex items-center gap-4 mb-6 z-10">
                <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm" aria-hidden="true"><span className="font-headline text-xl font-semibold leading-none">I</span></div>
                <div>
                  <h4 className="font-headline text-lg text-on-surface">Iulian</h4>
                  <p className="font-body text-label-sm uppercase tracking-wider text-on-surface-variant">Pacient Nutriție</p>
                </div>
              </div>
              <p className="font-body text-body-md text-on-surface italic flex-grow z-10 leading-relaxed text-lg">"O abordare complet diferită față de ce am experimentat până acum. Planul a fost simplu de urmat și rezultatele au apărut mult mai repede decât mă așteptam."</p>
            </div>
            <div className="bg-surface-bright/80 backdrop-blur-[24px] rounded-3xl p-8 box-shadow-ambient ghost-border flex flex-col relative transform md:translate-y-6">
              <div className="flex items-center gap-4 mb-6 z-10">
                <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-sm" aria-hidden="true"><span className="font-headline text-xl font-semibold leading-none">D</span></div>
                <div>
                  <h4 className="font-headline text-lg text-on-surface">Delia</h4>
                  <p className="font-body text-label-sm uppercase tracking-wider text-on-surface-variant">Pacient Diagnostic Celular</p>
                </div>
              </div>
              <p className="font-body text-body-md text-on-surface italic flex-grow z-10 leading-relaxed text-lg">"Mă simt ascultată și înțeleasă. Investigațiile au fost detaliate, iar acum am claritate asupra a ceea ce are nevoie corpul meu pentru a se vindeca."</p>
            </div>
            <div className="bg-surface-bright/80 backdrop-blur-[24px] rounded-3xl p-8 box-shadow-ambient ghost-border flex flex-col relative">
              <div className="flex items-center gap-4 mb-6 z-10">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm" aria-hidden="true"><span className="font-headline text-xl font-semibold leading-none">M</span></div>
                <div>
                  <h4 className="font-headline text-lg text-on-surface">Magda</h4>
                  <p className="font-body text-label-sm uppercase tracking-wider text-on-surface-variant">Pacient Shockwave</p>
                </div>
              </div>
              <p className="font-body text-body-md text-on-surface italic flex-grow z-10 leading-relaxed text-lg">"Durerile care mă limitau de ani de zile s-au redus semnificativ după doar câteva ședințe. Recomand cu toată încrederea profesionalismul doamnei doctor."</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
