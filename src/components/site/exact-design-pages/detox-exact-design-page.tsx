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
                <span className="italic text-secondary font-light">Fiziologic</span>
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-md font-light">Nu este neobișnuit să auzi oamenii că dau vina pe un metabolism lent pentru creșterea lor în greutate. Cantitatea minimă de energie de care organismul are nevoie în repaus pentru a efectua procesele chimice descrise mai sus se numește rată metabolică bazală (RMB) și poate reprezenta până la 80% din necesarul zilnic de energie al organismului, în funcție de vârsta și stilul de viață al fiecăruia. Un „metabolism lent” este mai precis descris ca un metabolism cu RMB scăzută.</p>
            </div>
            <div className="lg:col-span-7 relative h-[600px] md:h-[800px] w-full z-10 flex justify-end">
              <div className="relative w-[90%] md:w-[80%] h-full ml-auto">
                <img className="absolute inset-0 w-full h-full object-cover rounded-t-[20rem] shadow-xl" alt="Ethereal wellness imagery showing soft natural light falling on minimal organic shapes and textures" data-alt="Soft, diffused natural sunlight highlighting minimal, organic, curved architectural forms in warm ivory tones, evoking a sense of calm wellness" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkYabxZBGMS_qBjkRU2pQ9Szw2hSif77zGfXaKj0TBjaftg5D_Pfp3sZa-ZMxNnmdn9XzZEVLXvkBEKBt1tKuBJd9hJHwhIPdYsoo6eo4XHOlQQ66pHYG7LFOVCi74s5_X6jyja03q0vgMkawpSUEykWQ2I_F0-SZYhSoz1Id_rA7Xfzq1Oq_IcYclA42Q15mMI5GcsRx73yg6V_SzhQzlCnH85Hzes-2cC_AIWN9a7HnCGlyw6rX6x8UTDjPgsPOSPkQDYedhNWY" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-32 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-low/50 -z-20 skew-y-3 origin-top-left transform scale-110"></div>
          <div className="max-w-[1200px] mx-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 relative h-[500px] w-full"><img className="absolute inset-0 w-full h-full object-cover rounded-tr-[12rem] rounded-bl-[12rem] shadow-xl sepia-[0.2] contrast-125" alt="Abstract wellness texture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjfm6oq5KTZ7zBA-uky4Gx1a-2jrVSTDVzue_IYnqJjEnNhCyUaCVy-rAgAFFKnw6Qbon5uTBtIIH1XDDMF1_wr0B-DNv1GEFDZhFc4Ozo5vuasbBsQ_bmCKegh3T3bMF3d4-MU6pZLmkymhiGvdHkZeMi5du4uXhRCFbVuxP-Ubiud8407_oiGKPyGHVUmfpv5FW2GJnBpAUtwXaskTgtaW1RZ7q7S64lazqpfXpMsn1s5rGWobnMOr7VB6EZnkJZFV7Rj5HCoO0" /></div>
              <div className="order-1 md:order-2 text-left md:-ml-24 relative z-10 bg-background/80 backdrop-blur-sm p-12 shadow-2xl rounded-tr-[4rem] rounded-bl-[4rem]">
                <span className="font-body text-[11px] uppercase tracking-[0.15em] text-tertiary font-bold mb-4 block">Abordare Integrativă</span>
                <h2 className="font-headline text-5xl md:text-6xl text-on-surface mb-8 font-bold leading-none tracking-tight">
                  Tehnologia 
                  <br />
                  <span className="italic font-light text-secondary">Vitalfeld</span>
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
                  <span className="italic text-secondary font-light">medicală</span>
                  <br />
                  <span className="text-3xl md:text-4xl font-body uppercase tracking-widest text-primary/80 mt-4 block">GLOBAL DIAGNOSTICS</span>
                </h3>
                <p className="font-body text-lg text-on-surface-variant mb-16 leading-relaxed max-w-lg font-light">
                   vine deci ȋn sprijinul programului de slăbire ,,Recalibrarea Raspunsului Hormonal’’ avȃnd un efect de 
                  <strong className="text-secondary font-bold tracking-wide uppercase text-sm">STIMULARE METABOLICA</strong>
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
                <div className="absolute top-0 right-0 w-3/4 h-2/3 z-20"><img className="w-full h-full object-cover rounded-tl-[12rem] rounded-br-[4rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Diagnostic visualization" data-alt="Abstract macro photography of soft rippling water or fabric in warm neutral earth tones, representing gentle physiological healing and balance" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeokn4JJWrHiHzer3sd1WmtsAdIKRJ0G3JMNmdqInsRhAcRuGOSrVwXioYSCYVdrFH7E3-cFWJ21sHlMoXgXGy12husHFaAA7TqS99-1bDeH-Q9rkrxkDfzsFbX-6UR8JIFKHlZ43vmiOXiJcJ0CO_BGs-gnjvyfw96Pl1YiTsRjaYxd_oFGPUKlHNdypSuo9QxUhsMDFx2iu76cGOzkJakBNvhkFSKtVXnn2HthE9eTVJpPZaJ0w77Ytq6iQRdwnCvVff5U8S3Ck" /></div>
                <div className="absolute bottom-0 left-0 w-2/3 h-1/2 z-10 bg-secondary/10 overflow-hidden rounded-tr-[4rem] rounded-bl-[12rem]"><img className="w-full h-full object-cover mix-blend-multiply opacity-60" alt="Texture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8Va0OXY8ZyrGZKUzBdcE_guMV8-J_DJGv4vumwPojkWdAj_HgfNqDtBiQFxfCQMQOv2P9QzlV_28VxDdGidcMNeo7iFkd8Gf13ZBF3KQeEufJktnlfgSRi6eJh1_X3r_VrBVKCqMbWLVpEiOCEZ7ubg28iLW_gVZVdWAqG1txqwcMwN18wPdj_JucXhirgVA_-xSBs4yX56Llxl4oHRYTKJThqVo_ZTl6SWIRE7y_tAMU8mmuk9-pPh8uf-NWahyYZRnjNnaY1LE" /></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
