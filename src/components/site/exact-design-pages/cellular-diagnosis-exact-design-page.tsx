/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";

import styles from "./cellular-diagnosis-exact-design-page.module.css";

export function CellularDiagnosisExactDesignPage() {
  return (
    <div
      className={clsx(styles.root, "bg-surface-light text-ink font-body antialiased min-h-screen flex flex-col selection:bg-terracotta selection:text-white")}
      data-design-page="diagnoza-celulara"
      data-cms-override-version="diagnoza-celulara-2026-design-v2"
    >
      <div className="flex-grow w-full overflow-hidden">
        <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-surface-light">
          <div className="absolute top-0 right-0 w-2/3 md:w-1/2 h-[70vh] bg-stone/30 rounded-bl-[10rem] -z-10"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-terracotta/15 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
          <div className="absolute bottom-20 left-0 w-1/3 h-[50vh] bg-surface-dark/5 rounded-tr-[8rem] -z-10"></div>
          <div className="max-w-screen-2xl mx-auto px-6 md:px-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-10 relative z-20">
                <div className="inline-flex items-center space-x-4">
                  <div className="h-px w-12 bg-terracotta"></div>
                  <span className="font-label text-xs uppercase tracking-[0.25em] text-terracotta font-bold">Inovație elvețiană</span>
                </div>
                <h1 className="font-headline text-[4.5rem] md:text-[6.5rem] lg:text-[8rem] leading-[0.85] tracking-tighter text-ink -ml-1 md:-ml-2">
                  <span className="block font-bold">Diagnoza</span>
                  <span className="block italic font-light text-terracotta md:ml-24 mt-2">Celulară</span>
                </h1>
                <div className="md:ml-24 max-w-lg border-l border-terracotta/40 pl-8 py-1"><p className="font-body text-base md:text-lg leading-relaxed text-ink-light font-light">Măsurarea și analizarea stării energetice a celulelor cu o precizie microscopică. Tehnologie avansată în slujba echilibrului tău.</p></div>
              </div>
              <div className="lg:col-span-5 relative mt-16 lg:mt-0 -mx-6 md:mx-0"><div className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[3/4] lg:-ml-12 z-10"><img className="w-full h-full object-cover mask-fluid scale-[1.15] shadow-2xl origin-center" alt="Global Diagnostics Technology" src="https://lh3.googleusercontent.com/aida/ADBb0ui3eR3Fj0Szmbr80HnyXjubcJIPxuTE4yW1viuwyXIDmWLnk2A3wusCj67SH4gNHT1zOqptPXdA9o54PAG75_8wVuUBTTOUlTx7sePgeqS9CLpbdZVsbgvBhT2EPzu7Vi2fE0DMkSLfO3ZXewDBrgazr0ij0Gd3CH0XfXNKsWkFVVrVYrqXwY32qKPjtqaxxml1HokHTkxD28nN061htSalUU6DoDfM7yQf9YubwsvQUTD4n__uW-Dy2ORi9zMhEf_yEaKVOSLI6g" /></div></div>
            </div>
          </div>
        </section>
        <section className="relative bg-surface-dark text-surface-light overflow-visible">
          <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] -translate-y-[99%] pointer-events-none"><svg className="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[120px]" data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#1C1C1A"></path></svg></div>
          <div className="py-24 md:py-32 px-6 md:px-16 max-w-screen-2xl mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row gap-24 items-center">
              <div className="w-full lg:w-1/2 relative">
                <div className="aspect-[4/5] bg-stone/10 border border-stone/20 rounded-t-full rounded-b-[4rem] overflow-hidden p-4 relative">
                  <div className="absolute inset-0 bg-terracotta/5 mix-blend-overlay"></div>
                  <div className="w-full h-full rounded-t-full rounded-b-[3.5rem] bg-ink/50 flex flex-col items-center justify-center p-12 text-center border border-stone/10">
                    <span className="material-symbols-outlined text-terracotta text-6xl mb-8 font-light">biotech</span>
                    <div className="font-headline text-7xl mb-4 font-light italic">
                      200
                      <span className="text-terracotta not-italic">+</span>
                    </div>
                    <p className="font-label text-sm uppercase tracking-widest text-surface-light/60">Milioane de măsurători</p>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2 space-y-12">
                <div>
                  <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl leading-tight mb-8">
                    <span className="italic font-light">Tehnologie</span>
                     de
                    <br />
                    precizie clinică. 
                  </h2>
                  <p className="font-body text-lg leading-relaxed text-surface-light/80 font-light mb-6">Pentru a analiza starea energetică a organismului uman, GLOBAL DIAGNOSTICS transmite prin intermediul unor electrozi microcurenți ce interacționează cu câmpurile bioelectrice specifice ale organelor corpului.</p>
                  <p className="font-body text-lg leading-relaxed text-surface-light/80 font-light">Sunt astfel evidențiate carențele și nevoile organismului, precum și alți factori care pot influența negativ starea de sănătate, comparându-se răspunsurile energetice primite cu informațiile existente în baza de date a aparatului.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-surface-light/10">
                  <div className="space-y-4">
                    <span className="material-symbols-outlined text-terracotta text-3xl">body_system</span>
                    <h3 className="font-headline text-2xl font-medium">Scanare completă</h3>
                    <p className="font-body text-sm text-surface-light/60 font-light leading-relaxed">A organelor și sistemelor corpului în timp real.</p>
                  </div>
                  <div className="space-y-4">
                    <span className="material-symbols-outlined text-terracotta text-3xl">troubleshoot</span>
                    <h3 className="font-headline text-2xl font-medium">Detectare precisă</h3>
                    <p className="font-body text-sm text-surface-light/60 font-light leading-relaxed">A deficiențelor de funcționare la nivel celular.</p>
                  </div>
                  <div className="space-y-4">
                    <span className="material-symbols-outlined text-terracotta text-3xl">search_insights</span>
                    <h3 className="font-headline text-2xl font-medium">Identificare clară</h3>
                    <p className="font-body text-sm text-surface-light/60 font-light leading-relaxed">A factorilor reali ce declanșează dezechilibrele.</p>
                  </div>
                  <div className="space-y-4">
                    <span className="material-symbols-outlined text-terracotta text-3xl">healing</span>
                    <h3 className="font-headline text-2xl font-medium">Tratamente specifice</h3>
                    <p className="font-body text-sm text-surface-light/60 font-light leading-relaxed">Imediate, în concordanță cu dezechilibrele constatate.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] translate-y-[99%] pointer-events-none"><svg className="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[120px]" data-name="Layer 1" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#1C1C1A" transform="scale(1, -1) translate(0, -120)"></path></svg></div>
        </section>
        <section className="py-32 md:pt-48 md:pb-32 px-6 relative bg-stone/20">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="inline-block p-4 rounded-full bg-white shadow-sm border border-stone/50 mb-4"><span className="material-symbols-outlined text-terracotta text-4xl block">visibility</span></div>
            <h2 className="font-headline text-5xl md:text-6xl text-ink font-light tracking-tight">
              Viziune 
              <span className="italic text-terracotta">Clinică</span>
            </h2>
            <div className="space-y-8 font-body text-xl md:text-2xl leading-relaxed text-ink-light font-light">
              <p>Un medic, oricât de pregătit ar fi, nu poate să verifice pe parcursul unei singure consultații toate structurile anatomice, să evalueze relațiile dintre organe și carențele de vitamine sau minerale, sau să găsească cauzele ascunse ale unui simptom și să ofere un diagnostic imediat.</p>
              <div className="h-px w-24 bg-terracotta/30 mx-auto"></div>
              <p className="text-2xl md:text-3xl text-ink font-headline italic font-medium leading-normal">Un medic care folosește GLOBAL DIAGNOSTICS poate face asta, pentru că afecțiunile invizibile devin acum vizibile!</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
