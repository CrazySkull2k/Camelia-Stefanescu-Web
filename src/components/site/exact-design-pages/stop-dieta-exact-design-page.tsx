/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import clsx from "clsx";

import styles from "./stop-dieta-exact-design-page.module.css";

export function StopDietaExactDesignPage() {
  return (
    <div
      className={clsx(styles.root, "bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col")}
      data-design-page="stop-dieta"
      data-cms-override-version="stop-dieta-2026-design-v2"
    >
      <div className="flex-grow flex flex-col items-center">
        <section className="w-full max-w-screen-2xl mx-auto px-6 md:px-12 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#d6d4d3_1px,transparent_1px)] [background-size:32px_32px] opacity-40 -z-10"></div>
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse blur-[2px] opacity-60"></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse blur-[1px] opacity-40 delay-700"></div>
          <div className="absolute top-1/2 left-0 w-[20vw] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -rotate-12"></div>
          <div className="absolute bottom-1/4 right-0 w-[30vw] h-[1px] bg-gradient-to-r from-transparent via-secondary/20 to-transparent rotate-6"></div>
          <div className="w-full md:w-5/12 flex flex-col justify-center space-y-10 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-[1px] bg-secondary"></div>
              <span className="font-label text-xs uppercase tracking-[0.25em] text-secondary font-semibold">Nutriție & Echilibru Hormonal</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl lg:text-[5.5rem] text-on-surface leading-[1.05] tracking-tight">
              <span className="block text-primary/70 text-4xl md:text-5xl lg:text-6xl mb-2 font-medium tracking-normal">Servicii Online</span>
              <span className="italic font-light text-on-surface">Stop Dieta</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-md font-light leading-relaxed border-l-4 border-surface-variant pl-6">O abordare medicală personalizată pentru recalibrarea răspunsului hormonal, disponibilă oriunde te-ai afla.</p>
          </div>
          <div className="w-full md:w-7/12 relative">
            <div className="aspect-[4/3] md:aspect-[16/11] overflow-hidden shadow-2xl relative z-10 transition-transform duration-1000 designInline1">
              <img className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-1000" alt="Program Stop Dieta Online" src="/site/stop-dieta/stopdieta-online.png" />
              <div className="absolute inset-0 bg-gradient-to-tr from-surface/20 to-transparent mix-blend-overlay"></div>
            </div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-container rounded-full -z-0 blur-3xl opacity-50"></div>
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-surface-variant rounded-full -z-0 blur-3xl opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-[50%] border border-primary/10 -z-10 rotate-12"></div>
          </div>
        </section>
        <section className="w-full max-w-screen-2xl mx-auto px-6 md:px-12 py-12 md:py-16 bg-surface-container-low">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="space-y-6 sticky top-24">
              <h2 className="font-headline text-headline-md text-on-surface">Impactul Dietelor Repetate</h2>
              <div className="w-12 h-1 bg-secondary-container rounded-full"></div>
              <p className="font-body text-body-md text-on-surface leading-relaxed">Modificările comportamentului alimentar timp de ani de zile generează tulburări hormonale majore ce determină organismul să depoziteze țesut gras la nivel somatic și visceral.</p>
            </div>
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0px_12px_32px_rgba(49,51,44,0.05)] space-y-4">
              <span className="material-symbols-outlined text-3xl text-secondary designInline2">vital_signs</span>
              <h3 className="font-headline text-title-lg text-on-surface">Procesul de Vindecare</h3>
              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                Prin urmare, revenirea organismului la un metabolism corect, care să asigure menținerea unei greutăți optime, va necesita o perioadă de cel puțin{" "}
                <strong>3 luni</strong>{" "}
                de aplicare a principiilor programului de Recalibrare a Răspunsului Hormonal.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full max-w-screen-xl mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
            <h2 className="font-headline text-display-lg text-on-surface">Programul Online</h2>
            <p className="font-body text-title-lg text-on-surface-variant font-light">Dacă vrei să faci o schimbare în viața ta, dar nu locuiești în țară sau în București, poți intra în cel mai profesionist program de nutriție.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between group hover:bg-surface-container transition-colors duration-500 min-h-[200px]">
              <span className="material-symbols-outlined text-2xl text-primary mb-4 designInline3">science</span>
              <div>
                <h4 className="font-headline text-headline-md mb-2 text-on-surface">Fundament Științific</h4>
                <p className="font-body text-body-md text-on-surface-variant">Recalibrarea Răspunsului Hormonal are la bază ultimele descoperiri în domeniu medical și nutrițional.</p>
              </div>
            </div>
            <div className="bg-secondary-container p-6 rounded-2xl flex flex-col justify-between md:-translate-y-4 min-h-[200px]">
              <span className="material-symbols-outlined text-2xl text-on-secondary-container mb-4 designInline4">calendar_month</span>
              <div>
                <h4 className="font-headline text-headline-md mb-2 text-on-secondary-container">8 Ședințe Structurate</h4>
                <p className="font-body text-body-md text-on-secondary-container/80">Un set complet de întâlniri online, conceput pentru a asigura o tranziție sigură și eficientă.</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between group hover:bg-surface-container transition-colors duration-500 min-h-[200px]">
              <span className="material-symbols-outlined text-2xl text-primary mb-4 designInline5">medical_services</span>
              <div>
                <h4 className="font-headline text-headline-md mb-2 text-on-surface">Ghidaj Medical</h4>
                <p className="font-body text-body-md text-on-surface-variant">Susținut de un medic dedicat și cu o temeinică pregătire de specialitate pentru a-ți asigura succesul.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-screen-2xl mx-auto px-6 md:px-12 py-12 bg-surface">
          <div className="bg-tertiary-container rounded-[2rem] p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-8 -top-8 text-[150px] text-tertiary/5 select-none designInline6">favorite</span>
            <div className="max-w-4xl relative z-10 space-y-8">
              <p className="font-headline text-headline-sm md:text-headline-md text-on-tertiary-container italic leading-relaxed">"Voi fi lângă tine pentru a-ți ghida pașii, pentru a te sprijini când obosești și voi fi prima care te va felicita pentru succes."</p>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest shadow-sm"><img className="w-full h-full object-cover object-[center_30%]" alt="Dr. Camelia Ștefănescu" data-alt="Dr. Camelia Ștefănescu" src="/site/stop-dieta/stopdieta.png" /></div>
                <div>
                  <span className="block font-headline text-title-md text-on-tertiary-container">Dr. Camelia Ștefănescu</span>
                  <span className="block font-label text-label-sm text-on-tertiary-container/70 uppercase tracking-widest mt-1">Medic Specialist</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
