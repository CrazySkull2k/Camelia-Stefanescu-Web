/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";

import styles from "./detox-exact-design-page.module.css";

export function DetoxExactDesignPage() {
  return (
    <div
      className={clsx(styles.root, "font-body bg-surface text-on-surface antialiased selection:bg-secondary selection:text-white")}
      data-design-page="detox"
      data-cms-override-version="detox-fiziologic-2026-design-v2"
    >
      <div className="pt-32">
        <section className="relative pt-12 pb-32 px-6 md:px-12 max-w-[1440px] mx-auto overflow-hidden min-h-[90vh] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
            <div className="lg:col-span-5 relative z-20 md:pr-12">
              <span className="font-body text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-6 block">Editorial Perspective</span>
              <h1 className="font-headline text-6xl md:text-8xl font-bold leading-[0.9] text-on-surface mb-8 tracking-tighter">
                 Detox 
                <br />
                <span>Fiziologic</span>
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-md font-light">Nu este neobișnuit să auzi oamenii că dau vina pe un metabolism lent pentru creșterea lor în greutate. Cantitatea minimă de energie de care organismul are nevoie în repaus pentru a efectua procesele chimice descrise mai sus se numește rată metabolică bazală (RMB) și poate reprezenta până la 80% din necesarul zilnic de energie al organismului, în funcție de vârsta și stilul de viață al fiecăruia. Un „metabolism lent” este mai precis descris ca un metabolism cu RMB scăzută.</p>
            </div>
            <div className="lg:col-span-7 relative h-[600px] md:h-[800px] w-full z-10 flex justify-end">
              <div className="relative w-[90%] md:w-[80%] h-full ml-auto">
                <img className="absolute inset-0 w-full h-full object-cover rounded-t-[20rem] shadow-xl" alt="Detox fiziologic" src="/site/detox/detox.png" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-32 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-low/50 -z-20 skew-y-3 origin-top-left transform scale-110"></div>
          <div className="max-w-[1200px] mx-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative h-[500px] w-full"><img className="absolute inset-0 w-full h-full object-cover rounded-tr-[12rem] rounded-bl-[12rem] shadow-xl sepia-[0.2] contrast-125" alt="Tehnologia Vitalfeld" src="/site/detox/vitafeld.png" /></div>
              <div className="order-1 md:order-2 text-left md:-ml-24 relative z-10 bg-background/80 backdrop-blur-sm p-12 shadow-2xl rounded-tr-[4rem] rounded-bl-[4rem]">
                <span className="font-body text-[11px] uppercase tracking-[0.15em] text-tertiary font-bold mb-4 block">Abordare Integrativă</span>
                <h2 className="font-headline text-5xl md:text-6xl font-bold leading-[0.9] text-on-surface mb-8 tracking-tighter">
                  Tehnologia 
                  <br />
                  <span>Vitalfeld</span>
                </h2>
                <p className="font-body text-xl text-on-surface-variant font-light leading-relaxed">Este o procedură non-invazivă prin care putem face o „curățenie” internă eficientă, cu rezultate vizibile pe termen lung.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-40 px-6 md:px-12 max-w-[1440px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
            <div className="lg:col-span-6 relative z-10">
              <div className="sticky top-40">
                <h3 className="font-headline text-5xl md:text-7xl font-bold leading-[0.9] text-on-surface mb-10 tracking-tighter">
                   Aparatura 
                  <br />
                  <span>medicală</span>
                  <br />
                  <span className="mt-4 block">GLOBAL DIAGNOSTICS</span>
                </h3>
                <p className="font-body text-lg text-on-surface-variant mb-16 leading-relaxed max-w-lg font-light">
                  vine deci ȋn sprijinul programului de slăbire ,,Recalibrarea Raspunsului Hormonal’’ avȃnd un efect de{" "}
                  <strong className="text-secondary font-bold tracking-wide uppercase text-sm">STIMULARE METABOLICA</strong>{" "}
                  prin:
                </p>
                <ul className="space-y-10 max-w-lg">
                  <li className="flex items-start gap-6 group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full border border-secondary text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-500"><span className="font-headline italic text-xl">1</span></div>
                    <span className="font-body text-lg text-on-surface font-light leading-relaxed group-hover:text-secondary transition-colors duration-500">Stimularea eliminării deșeurilor stocate sau a reziduurilor obișnuite rezultate din reacțiile biochimice ale organismului</span>
                  </li>
                  <li className="flex items-start gap-6 group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full border border-secondary text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-500"><span className="font-headline italic text-xl">2</span></div>
                    <span className="font-body text-lg text-on-surface font-light leading-relaxed group-hover:text-secondary transition-colors duration-500">Menținerea echilibrului acido-bazic, modificat de obicei ȋn condiții de stres cronic</span>
                  </li>
                  <li className="flex items-start gap-6 group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full border border-secondary text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-500"><span className="font-headline italic text-xl">3</span></div>
                    <span className="font-body text-lg text-on-surface font-light leading-relaxed group-hover:text-secondary transition-colors duration-500">Refacerea sănătății intestinului, implicit a absorbției nutrienților</span>
                  </li>
                  <li className="flex items-start gap-6 group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full border border-secondary text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-500"><span className="font-headline italic text-xl">4</span></div>
                    <span className="font-body text-lg text-on-surface font-light leading-relaxed group-hover:text-secondary transition-colors duration-500">Echilibrarea endocrină la nivel de axă HPA (hipotalamus-hipofiză-suprarenale), respectiv a hormonilor ce intervin ȋn menținerea corectă a balanței apetit-sațietate</span>
                  </li>
                  <li className="flex items-start gap-6 group">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full border border-secondary text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-500"><span className="font-headline italic text-xl">5</span></div>
                    <span className="font-body text-lg text-on-surface font-light leading-relaxed group-hover:text-secondary transition-colors duration-500">Ameliorarea tulburărilor de somn și recăpătarea unei stări energetice sănătoase</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="lg:col-span-6 relative mt-16 lg:mt-0">
              <div className="w-full h-[600px] lg:h-[900px] relative">
                <div className="absolute top-0 right-0 w-3/4 h-2/3 z-20"><img className="w-full h-full object-cover rounded-tl-[12rem] rounded-br-[4rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Aparatura medicala pentru detox fiziologic" src="/site/detox/aparatura-medicala-1.png" /></div>
                <div className="absolute bottom-0 left-0 w-2/3 h-1/2 z-10 bg-secondary/10 overflow-hidden rounded-tr-[4rem] rounded-bl-[12rem]"><img className="w-full h-full object-cover mix-blend-multiply opacity-60" alt="Detaliu aparatura medicala" src="/site/detox/aparatura-medicala-2.png" /></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
