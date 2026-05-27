/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text, react/no-unescaped-entities */
import clsx from "clsx";

import styles from "./nutrition-services-exact-design-page.module.css";

export function NutritionServicesExactDesignPage() {
  return (
    <div
      className={clsx(styles.root, "bg-background text-on-surface selection:bg-secondary-fixed selection:text-on-secondary-container")}
      data-design-page="servicii-nutritie"
      data-cms-override-version="servicii-nutritie-2026-design-v2"
    >
      <div className="pt-32 pb-24 px-8 max-w-[1440px] mx-auto">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-40 items-start">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden editorial-shadow"><img className="w-full h-full object-cover object-[78%_center]" alt="Primul pas catre sanatate prin nutritie" data-alt="Primul pas catre sanatate prin nutritie" src="/site/nutrition-services/primul-pas-catre-sanatate.png" /></div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-secondary-fixed rounded-full flex items-center justify-center p-6 text-center editorial-shadow"><span className="font-headline italic text-on-secondary-container text-lg">Echilibru prin știință și empatie</span></div>
          </div>
          <div className="lg:col-span-7 lg:pl-20 pt-16">
            <div className="space-y-10">
              <h2 className="font-headline text-5xl text-on-surface italic">Primul pas către sănătate</h2>
              <p className="font-body text-base leading-loose text-on-surface-variant max-w-2xl">Indiferent de varianta de consultație de nutriție, la prima noastră întâlnire voi avea nevoie de chestionarul de evaluare nutrițională completat și un set de analize recente. Formularele le găsești la rubrica Programări.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
                <div className="p-10 bg-surface-container-low rounded-3xl space-y-5">
                  <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
                  <h3 className="font-label text-[11px] uppercase tracking-[0.2em] font-bold">Chestionar Nutrițional</h3>
                  <p className="font-body text-sm leading-relaxed text-on-surface-variant">O analiză exhaustivă a obiceiurilor alimentare actuale și a sensibilităților.</p>
                </div>
                <div className="p-10 bg-surface-container-low rounded-3xl space-y-5">
                  <span className="material-symbols-outlined text-primary text-3xl">clinical_notes</span>
                  <h3 className="font-label text-[11px] uppercase tracking-[0.2em] font-bold">Evaluare Inițială</h3>
                  <p className="font-body text-sm leading-relaxed text-on-surface-variant">Discuție aprofundată despre starea de sănătate și stabilirea indicatorilor de succes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 space-y-10">
              <div className="flex items-center gap-4 text-outline font-label text-[10px] uppercase tracking-[0.2em]">
                <span className="w-12 h-[1px] bg-outline/30"></span>
                 SĂNĂTATE SISTEMICĂ
              </div>
              <h2 className="font-headline text-6xl text-on-surface italic text-7xl md:text-8xl">Nutriție pentru slăbit</h2>
              <p className="font-body text-base text-on-surface-variant leading-loose">Modificările comportamentului alimentar timp de ani de zile generează tulburări hormonale majore ce determină organismul să depoziteze țesut gras la nivel somatic și visceral. Prin urmare, revenirea organismului la un metabolism corect, care să asigure menținerea unei greutăți optime, va necesita o perioadă de cel puțin 3 luni de aplicare a principiilor programului de Recalibrare a Răspunsului Hormonal. Urmărirea și consilierea în această perioadă se fac la un interval de 2–3 săptămâni.</p>
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#735a42] flex items-center justify-center"><span className="material-symbols-outlined text-white text-[14px]">check</span></div>
                  <span className="font-body text-[#5e6058]">Optimizarea metabolismului bazal</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#735a42] flex items-center justify-center"><span className="material-symbols-outlined text-white text-[14px]">check</span></div>
                  <span className="font-body text-[#5e6058]">Gestionarea sațietății și a poftelor</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#735a42] flex items-center justify-center"><span className="material-symbols-outlined text-white text-[14px]">check</span></div>
                  <span className="font-body text-[#5e6058]">Educație pentru menținere pe viață</span>
                </div>
              </div>
              <button className="flex items-center gap-4 group font-label text-[12px] uppercase tracking-[0.2em] font-bold text-primary pt-4">
                 Detalii Program 
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </button>
            </div>
            <div className="order-1 lg:order-2"><div className="aspect-[16/10] rounded-[2rem] overflow-hidden editorial-shadow"><img className="w-full h-full object-cover object-[center_28%]" alt="Nutritie pentru slabit" data-alt="Nutritie pentru slabit" src="/site/nutrition-services/nutritie-pentru-slabit.png" /></div></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center bg-surface-container-low rounded-[4rem] p-12 lg:p-24">
            <div className="lg:col-span-5"><div className="aspect-square rounded-[3rem] overflow-hidden editorial-shadow"><img className="w-full h-full object-cover" alt="Nutritie clinica" data-alt="Nutritie clinica" src="/site/nutrition-services/nutritie-clinica.png" /></div></div>
            <div className="lg:col-span-7 space-y-10 lg:pl-12">
              <div className="flex items-center gap-4 text-outline font-label text-[10px] uppercase tracking-[0.2em]">
                <span className="w-8 h-[1px] bg-outline/40"></span>
                 SĂNĂTATE SISTEMICĂ 
              </div>
              <h2 className="font-headline text-6xl text-on-surface italic text-7xl md:text-8xl">Nutriție clinică</h2>
              <p className="font-body text-base text-on-surface-variant leading-loose">Condițiile vieții moderne provoacă, într-un număr din ce în ce mai mare, diverse afecțiuni. Ai probleme de digestie, imunitatea ți-a scăzut considerabil, ficatul îți creează disconfort, ai frecvent infecții urinare, stresul ți-a dereglat funcția tiroidiană sau simptomele menopauzei ți-au schimbat drastic viața? Toate se pot optimiza, astfel încât să îți recapeți energia și pofta de viață.</p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-2xl">
                  <span className="material-symbols-outlined text-primary">feed</span>
                  <span className="font-label text-[10px] uppercase tracking-[0.15em]">Digestie</span>
                </div>
                <div className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-2xl">
                  <span className="material-symbols-outlined text-primary">self_care</span>
                  <span className="font-label text-[10px] uppercase tracking-[0.15em]">Anti-Stres</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-outline font-label text-[10px] uppercase tracking-[0.2em]">
                <span className="w-8 h-[1px] bg-outline/40"></span>
                 PERFORMANȚĂ & ENERGIE 
              </div>
              <h2 className="font-headline text-6xl text-on-surface italic text-7xl md:text-8xl">Nutriție sportivă</h2>
              <p className="font-body text-base text-on-surface-variant leading-loose">Pentru cei care practică sport de plăcere sau de performanță, nutriția trebuie gândită în funcție de necesitățile fiecăruia. Sunt atleți care, prin natura sportului, trebuie să se concentreze pe forță, viteză de reacție și/sau anduranță. Alimentația, hidratarea și administrarea de suplimente trebuie atent planificate pentru a acoperi nevoile energetice din timpul antrenamentului sau competiției sportive, dar și pentru a permite o recuperare optimă. Totul este personalizat în funcție de vârstă, constituția sportivului, compoziția corporală (masă musculară, grăsime somatică, grăsime viscerală, nivel de hidratare).</p>
              <div className="flex items-center gap-16 pt-4">
                <div className="text-center">
                  <div className="font-headline text-5xl text-primary mb-2">94%</div>
                  <div className="font-label text-[10px] uppercase tracking-[0.2em] text-outline">Recuperare Rapidă</div>
                </div>
                <div className="text-center">
                  <div className="font-headline text-5xl text-primary mb-2">2.5x</div>
                  <div className="font-label text-[10px] uppercase tracking-[0.2em] text-outline">Rezistență Sporită</div>
                </div>
              </div>
              <div className="pt-6"><button className="bg-primary text-on-primary px-12 py-5 rounded-full font-label text-[11px] uppercase tracking-[0.2em] hover:bg-primary-dim transition-all">Solicită Evaluarea</button></div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden editorial-shadow"><img className="w-full h-full object-cover" alt="Nutritie sportiva" data-alt="Nutritie sportiva" src="/site/nutrition-services/nutritie-sportiv.png" /></div>
            </div>
          </div>
        </section>
        <section className="mt-48 text-center py-40 bg-secondary-fixed/20 rounded-[4rem]">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="font-headline text-6xl text-on-surface italic leading-tight text-7xl md:text-8xl">Începe călătoria ta către o viață echilibrată</h2>
            <p className="font-body text-lg text-on-surface-variant leading-relaxed">Suntem aici să te ghidăm cu expertiză clinică și o abordare profund umană. Programează astăzi prima ta discuție.</p>
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <button className="bg-primary text-on-primary px-14 py-5 rounded-full font-label text-[12px] uppercase tracking-[0.2em] hover:shadow-xl transition-all">Programare Online</button>
              <button className="bg-surface-container-lowest text-on-surface px-14 py-5 rounded-full font-label text-[12px] uppercase tracking-[0.2em] border border-outline-variant/30 hover:bg-surface-container transition-all">Contactează-ne</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
