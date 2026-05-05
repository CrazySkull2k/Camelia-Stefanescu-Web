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
        paragraphs: [
          "Cercetările din întreagă lume au arătat că terapia cu unde de şoc creează în zona tratată, o reacţie biologică de răspuns a organismului. Sub influenţa undelor de şoc organismul răspunde prin producerea unor proteine specifice – factori de creştere – stimulându-se formarea de către organism în zona tratată de noi vase sangvine. Drept urmare, începe astfel procesul de vindecare a ţesuturilor tratate continuând mai apoi într-un mod accelerat.",
          "Aceasta metoda de tratament este o premiera deoarece protocoalele folosesc unde de soc focusate. Prin această metodă de tratament nu există nici un efect advers, răspunsul organismului fiind unul absolut natural. În loc de a folosi diverse substanţe produse în mod artificial în laborator, ce pot avea efecte secundare, terapia prin unde de şoc stimulează organismul să folosească propriile mecanisme de refacere. Ca urmare a tratamentului, se iniţiază producerea proteinelor specifice, care atrag celulele stem din cel mai apropiat os, stimulându-se astfel diferenţierea lor. În acest fel, organismul va „repara” prin regenerarea celulară ţesuturile afectate.",
        ],
        title: "Ce este terapia cu unde de şoc (Shockwave Therapy)?",
      },
      {
        paragraphs: [
          "Undele de şoc sonice folosite în această terapie sunt generate cu viteză foarte mare prin intermediul tehnologiei electro-hidraulice de ultimă generaţie existentă şi în cabinetul nostru. Undele de şoc sunt create prin generarea unei scântei electrice de către un electrod aflat într-un mediu lichid. Descărcarea electrică provoacă o bulă de vaporizare care se extinde şi apoi imediat se contractă. Se formează astfel o undă de şoc cu energie foarte mare care este direcţionată precis către zona tratată.",
          "În funcţie de afecţiunea pacientului, se foloseşte de asemenea şi tehnologie de generare a undei de şoc prin aer comprimat. Acest tip de undă se folosește pentru structurile superficiale ale tegumentului deoarece prin reducerea tensiunii musculare, influențează pozitiv tratamentul diverselor afecţiuni, așa cum sunt tendinopatiile – dureri, inflamări cronice ale tendoanelor.",
          "Prin protocoalele care trebuie urmate şi care sunt rezultatul experienţei de peste 20 de ani a profesorului Wolfgang Schaden, membru al consiliului de conducere al ISMST – International Society for Medical Shockwave Treatment – putem prescrise astfel cele mai bune metode de utilizare a tratamentelor prin unde de şoc.",
        ],
        title: "Tehnologia de generare a undelor de şoc",
      },
    ],
  },
  treatmentMode: {
    title: "Mod Tratament",
    topParagraph:
      "După aplicarea pe piele a unui gel conductor pentru ultrasunete în zona afectată, sonda de tratament este poziţionată şi în funcţie de tratamentul necesar, sunt aplicate între 500 şi 3000 de impulsuri cu unde de şoc, în funcţie de protocoalele ce trebuiesc urmate pentru fiecare afecţiune.",
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
          "Terapia este nedureroasă, durează puţin (aproximativ 8-15 minute), iar şedinţele se fac la interval de 7 – 10 zile.",
          "În general sunt necesare 3 şedinţe de tratament, dar în anumite patologii se pot recomanda 5 – 6 şedinţe de tratament. Între aplicaţii se recomandă repausul zonei afectate.",
          "Efectele secundare tratamentului sunt foarte rare, se remit rapid şi constau în apariţia de peteşii, edeme şi eriteme.",
        ],
      },
      {
        paragraphs: [
          "Cabinetul nostru dispune de tehnologie de ultimă generaţie produsă de compania MTS din Germania care furnizează echipamente şi pentru clinica de traumatologie AUVA Meidling din Viena.",
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
          "Contraindicaţiile terapiei cu unde de şoc se referă la pacienţii cu afecţiuni maligne, boli ale sângelui şi tratamente anticoagulante, tratament cu corticosteroizi în ultimele 6 săptămâni, tromboze, sarcină (aplicaţii lombare şi abdominale) şi aplicarea pe anumite ţesuturi (ochi şi zona periorbitala, miocard, măduva spinării, ficat şi rinichi).",
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
      "Dacă aţi fost diagnosticat cu una din afecţiunile de mai sus, nu vă obişnuiţi să trăiţi cu durerea. Toate aceste afecţiuni pot fi vindecate sau ameliorate. În anumite situaţii, chiar după prima şedinţă, durerea scade până la dispariţie.",
    title: "Ce putem trata",
    treatments: [
      "Dermatologie – tratamentul arsurilor, cicatricilor cheloide, răni cronice sau acute ale ţesuturilor moi, acnee",
      "Diabet – tratamentul piciorului diabetic, ulcerelor venoase.",
      "Disfuncţii erectile",
      "Boală Peyronie",
      "Parodontoză",
      "Tratamentul celulitei prin spargerea adipocitelor fără a leza pielea.",
    ],
  },
} as const;
