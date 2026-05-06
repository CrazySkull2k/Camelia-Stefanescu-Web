export const shockwaveNavigation = [
  {
    href: "/terapie-shockwave/ce-este-terapia-shockwave",
    id: "shockwave-what-is",
    label: "Ce este terapia shockwave",
  },
  {
    href: "/terapie-shockwave/ce-putem-trata",
    id: "shockwave-what-we-treat",
    label: "Ce putem trata",
  },
  {
    href: "/terapie-shockwave/mod-tratament",
    id: "shockwave-treatment-mode",
    label: "Mod Tratament",
  },
] as const;

export const shockwavePageContent = {
  whatIs: {
    title: "Ce este Terapia Shockwave",
    sections: [
      {
        title: "Ce este terapia cu unde de șoc (Shockwave Therapy)?",
        paragraphs: [
          "Cercetările din întreaga lume au arătat că terapia cu unde de șoc creează, în zona tratată, o reacție biologică de răspuns a organismului. Sub influența undelor de șoc, organismul răspunde prin producerea unor proteine specifice, factori de creștere, stimulându-se formarea de noi vase sangvine în zona tratată. Drept urmare, începe procesul de vindecare a țesuturilor, continuând apoi într-un mod accelerat.",
          "Această metodă de tratament este o premieră deoarece protocoalele folosesc unde de șoc focusate. Prin această metodă nu există efecte adverse, răspunsul organismului fiind unul absolut natural. În locul unor substanțe produse artificial în laborator, care pot avea efecte secundare, terapia prin unde de șoc stimulează organismul să folosească propriile mecanisme de refacere. Ca urmare a tratamentului, se inițiază producerea proteinelor specifice care atrag celulele stem din cel mai apropiat os, stimulând diferențierea lor. În acest fel, organismul va repara prin regenerare celulară țesuturile afectate.",
        ],
      },
      {
        title: "Tehnologia de generare a undelor de șoc",
        paragraphs: [
          "Undele de șoc sonice folosite în această terapie sunt generate cu viteză foarte mare prin intermediul tehnologiei electro-hidraulice de ultimă generație existentă și în cabinetul nostru. Undele de șoc sunt create prin generarea unei scântei electrice de către un electrod aflat într-un mediu lichid. Descărcarea electrică provoacă o bulă de vaporizare care se extinde și apoi imediat se contractă. Se formează astfel o undă de șoc cu energie foarte mare, direcționată precis către zona tratată.",
          "În funcție de afecțiunea pacientului, se folosește și tehnologia de generare a undei de șoc prin aer comprimat. Acest tip de undă este folosit pentru structurile superficiale ale tegumentului deoarece, prin reducerea tensiunii musculare, influențează pozitiv tratamentul diverselor afecțiuni, cum sunt tendinopatiile, durerile și inflamațiile cronice ale tendoanelor.",
          "Prin protocoalele care trebuie urmate și care sunt rezultatul experienței de peste 20 de ani a profesorului Wolfgang Schaden, membru al consiliului de conducere al ISMST - International Society for Medical Shockwave Treatment -, pot fi prescrise cele mai bune metode de utilizare a tratamentelor prin unde de șoc.",
        ],
      },
    ],
  },
  treatmentMode: {
    title: "Mod Tratament",
    topParagraph:
      "După aplicarea pe piele a unui gel conductor pentru ultrasunete în zona afectată, sonda de tratament este poziționată și, în funcție de tratamentul necesar, sunt aplicate între 500 și 3000 de impulsuri cu unde de șoc, conform protocoalelor care trebuie urmate pentru fiecare afecțiune.",
    sections: [
      {
        image: {
          alt: "Aplicarea terapiei shockwave in zona umarului",
          height: 248,
          src: "/site/shockwave/shoulder.png",
          width: 250,
        },
        imageSide: "left" as const,
        paragraphs: [
          "Terapia este nedureroasă, durează puțin, aproximativ 8-15 minute, iar ședințele se fac la interval de 7-10 zile.",
          "În general sunt necesare 3 ședințe de tratament, dar în anumite patologii se pot recomanda 5-6 ședințe. Între aplicații se recomandă repausul zonei afectate.",
          "Efectele secundare ale tratamentului sunt foarte rare, se remit rapid și constau în apariția de peteșii, edeme și eriteme.",
        ],
      },
      {
        paragraphs: [
          "Cabinetul nostru dispune de tehnologie de ultimă generație produsă de compania MTS din Germania, care furnizează echipamente și pentru clinica de traumatologie AUVA Meidling din Viena.",
        ],
      },
      {
        image: {
          alt: "Aplicarea terapiei shockwave in zona piciorului",
          height: 248,
          src: "/site/shockwave/foot.png",
          width: 250,
        },
        imageSide: "right" as const,
        paragraphs: [
          "Contraindicațiile terapiei cu unde de șoc se referă la pacienții cu afecțiuni maligne, boli ale sângelui și tratamente anticoagulante, tratament cu corticosteroizi în ultimele 6 săptămâni, tromboze, sarcină pentru aplicații lombare și abdominale și aplicarea pe anumite țesuturi, precum ochii și zona periorbitală, miocardul, măduva spinării, ficatul și rinichii.",
        ],
      },
    ],
  },
  whatWeTreat: {
    illustration: {
      alt: "Zone si afectiuni tratate prin terapia shockwave",
      height: 325,
      src: "/site/shockwave/silueta.png",
      width: 637,
    },
    intro:
      "Dacă ați fost diagnosticat cu una dintre afecțiunile de mai sus, nu vă obișnuiți să trăiți cu durerea. Toate aceste afecțiuni pot fi vindecate sau ameliorate. În anumite situații, chiar după prima ședință, durerea scade până la dispariție.",
    title: "Ce putem trata",
    treatments: [
      "Dermatologie - tratamentul arsurilor, cicatricilor cheloide, rănilor cronice sau acute ale țesuturilor moi și acneei",
      "Diabet - tratamentul piciorului diabetic și al ulcerelor venoase",
      "Disfuncții erectile",
      "Boală Peyronie",
      "Parodontoză",
      "Tratamentul celulitei prin spargerea adipocitelor fără a leza pielea",
    ],
  },
} as const;
