import {
  aboutCertificateImages,
  aboutCredentials,
  aboutFaq,
  aboutStats,
  homeHighlights,
  homeStats,
  homeTestimonials,
  servicePageContent,
} from "@/content/site-content";
import { shockwavePageContent } from "@/content/shockwave-content";

export const cmsAccentPresets = ["default", "peach", "sage", "cream", "stone"] as const;
export const CMS_IMAGE_OVERRIDES_SECTION = "__imageOverrides";
export const CMS_TEXT_OVERRIDES_SECTION = "__textOverrides";

export type CmsAccentPreset = (typeof cmsAccentPresets)[number];

export type CmsImageValue = {
  alt: string;
  src: string;
};

export type CmsImageOverride = CmsImageValue & {
  label?: string;
};

export type CmsSectionContent = Record<string, unknown>;

export type CmsPageContent = Record<string, CmsSectionContent>;

export type CmsTextOverride = {
  label?: string;
  text: string;
};

type CmsBaseField = {
  helpText?: string;
  label: string;
  name: string;
};

export type CmsCardFieldDefinition =
  | (CmsBaseField & {
      maxLength?: number;
      type: "text" | "textarea" | "richText";
    })
  | (CmsBaseField & {
      type: "image";
    })
  | (CmsBaseField & {
      maxItems?: number;
      type: "list";
    })
  | (CmsBaseField & {
      options?: CmsAccentPreset[];
      type: "accentPreset";
    });

export type CmsFieldDefinition =
  | (CmsBaseField & {
      maxLength?: number;
      type: "text" | "textarea" | "richText";
    })
  | (CmsBaseField & {
      type: "image";
    })
  | (CmsBaseField & {
      maxItems?: number;
      type: "list";
    })
  | (CmsBaseField & {
      maxItems?: number;
      type: "stats";
    })
  | (CmsBaseField & {
      maxItems?: number;
      type: "faq";
    })
  | (CmsBaseField & {
      cardFields: CmsCardFieldDefinition[];
      maxItems?: number;
      type: "cards";
    })
  | (CmsBaseField & {
      options?: CmsAccentPreset[];
      type: "accentPreset";
    });

export type CmsSectionDefinition = {
  description?: string;
  fields: CmsFieldDefinition[];
  key: string;
  title: string;
};

export type CmsPageDefinition = {
  defaultContent: CmsPageContent;
  label: string;
  pageKey: string;
  route: string;
  sections: CmsSectionDefinition[];
};

export const accentPresetLabels: Record<CmsAccentPreset, string> = {
  cream: "Crem",
  default: "Default",
  peach: "Peach",
  sage: "Sage",
  stone: "Stone",
};

const heroFields: CmsFieldDefinition[] = [
  { label: "Eyebrow", maxLength: 120, name: "eyebrow", type: "text" },
  { label: "Titlu", maxLength: 180, name: "title", type: "text" },
  { label: "Descriere", maxLength: 420, name: "description", type: "textarea" },
  { label: "Accent vizual", name: "accent", type: "accentPreset" },
];

export const cmsPageDefinitions: CmsPageDefinition[] = [
  {
    defaultContent: {
      hero: {
        accent: "default",
        description: "",
        eyebrow: "",
        image: {
          alt: "Dr. Camelia Stefanescu",
          src: "/site/theme/assets/images/hero/hero_image_1-min.jpg",
        },
        title: "Dr. Camelia Stefanescu",
      },
      highlights: { items: homeHighlights },
      stats: { items: homeStats },
      testimonials: {
        description: "Afla parerea celor care au facut o schimbare",
        items: homeTestimonials.map((testimonial) => ({
          image: {
            alt: testimonial.name,
            src: testimonial.image,
          },
          name: testimonial.name,
          quote: testimonial.quote,
          role: testimonial.role,
        })),
        title: "Testimoniale",
      },
    },
    label: "Acasa",
    pageKey: "home",
    route: "/",
    sections: [
      {
        fields: [
          { label: "Titlu hero", maxLength: 180, name: "title", type: "text" },
          { label: "Imagine hero", name: "image", type: "image" },
          { label: "Accent vizual", name: "accent", type: "accentPreset" },
        ],
        key: "hero",
        title: "Hero",
      },
      {
        fields: [
          {
            helpText: "Cate o acreditare pe linie.",
            label: "Repere profesionale",
            maxItems: 8,
            name: "items",
            type: "list",
          },
        ],
        key: "highlights",
        title: "Repere",
      },
      {
        fields: [{ label: "Statistici", maxItems: 4, name: "items", type: "stats" }],
        key: "stats",
        title: "Statistici",
      },
      {
        fields: [
          { label: "Titlu sectiune", maxLength: 120, name: "title", type: "text" },
          { label: "Descriere", maxLength: 220, name: "description", type: "textarea" },
          {
            cardFields: [
              { label: "Nume", maxLength: 80, name: "name", type: "text" },
              { label: "Rol", maxLength: 120, name: "role", type: "text" },
              { label: "Citat", maxLength: 700, name: "quote", type: "textarea" },
              { label: "Imagine", name: "image", type: "image" },
            ],
            label: "Testimoniale",
            maxItems: 6,
            name: "items",
            type: "cards",
          },
        ],
        key: "testimonials",
        title: "Testimoniale",
      },
    ],
  },
  {
    defaultContent: {
      certificates: {
        items: aboutCertificateImages.map((image, index) => ({
          image: {
            alt: `Certificare ${index + 1}`,
            src: image,
          },
          title: `Certificare ${index + 1}`,
        })),
      },
      faq: { items: aboutFaq },
      hero: {
        accent: "cream",
        description: "",
        eyebrow: "",
        title: "Despre mine",
      },
      intro: {
        credentials: aboutCredentials,
        image: {
          alt: "Despre Dr. Camelia Stefanescu",
          src: "/site/theme/assets/images/about/about_image_1-min.jpg",
        },
        title: "Dr. Camelia Stefanescu",
      },
      purpose: {
        paragraphs: [
          "Practica medicala construieste o punte intre nutritie, medicina integrativa si sanatatea celulara. Accentul este pe evaluare corecta, explicatii clare si solutii pe care pacientul le poate aplica in viata reala.",
          "Lucrul cu sportivii de performanta a confirmat acelasi principiu: rezultatele apar cand fiecare detaliu este personalizat. Acum aceeasi rigoare este pusa in slujba oamenilor care vor sa-si recastige echilibrul metabolic si starea de bine.",
        ],
        title: "Scopul meu",
      },
      stats: { items: aboutStats },
    },
    label: "Despre mine",
    pageKey: "about",
    route: "/about",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu", maxLength: 180, name: "title", type: "text" },
          { label: "Imagine", name: "image", type: "image" },
          { label: "Acreditari", maxItems: 12, name: "credentials", type: "list" },
        ],
        key: "intro",
        title: "Introducere",
      },
      {
        fields: [
          { label: "Titlu", maxLength: 160, name: "title", type: "text" },
          { label: "Paragrafe", maxItems: 4, name: "paragraphs", type: "list" },
        ],
        key: "purpose",
        title: "Scop",
      },
      {
        fields: [{ label: "Statistici", maxItems: 4, name: "items", type: "stats" }],
        key: "stats",
        title: "Statistici",
      },
      {
        fields: [
          {
            cardFields: [
              { label: "Titlu", maxLength: 90, name: "title", type: "text" },
              { label: "Imagine", name: "image", type: "image" },
            ],
            label: "Certificate",
            maxItems: 8,
            name: "items",
            type: "cards",
          },
        ],
        key: "certificates",
        title: "Certificate",
      },
      {
        fields: [{ label: "Intrebari frecvente", maxItems: 8, name: "items", type: "faq" }],
        key: "faq",
        title: "FAQ",
      },
    ],
  },
  {
    defaultContent: {
      hero: {
        accent: "peach",
        description: "",
        eyebrow: "",
        title: "Servicii de nutritie",
      },
      intro: {
        body:
          "indiferent de varianta de consultatie de nutritie, la prima noastra intalnire voi avea nevoie de chestionarul de evaluare nutritionala completat si un set de analize recente. Formularele le gasesti la rubrica programari",
        title: "Servicii de nutritie",
      },
      services: {
        items: servicePageContent.nutritie.sections.map((section) => ({
          accent: "default",
          body: section.body,
          title: section.title,
        })),
      },
    },
    label: "Servicii de nutritie",
    pageKey: "servicii-nutritie",
    route: "/serviciinutritie",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu", maxLength: 160, name: "title", type: "text" },
          { label: "Intro", maxLength: 900, name: "body", type: "textarea" },
        ],
        key: "intro",
        title: "Introducere",
      },
      {
        fields: [
          {
            cardFields: [
              { label: "Titlu", maxLength: 140, name: "title", type: "text" },
              { label: "Text", maxLength: 1400, name: "body", type: "textarea" },
              { label: "Accent", name: "accent", type: "accentPreset" },
            ],
            label: "Carduri servicii",
            maxItems: 6,
            name: "items",
            type: "cards",
          },
        ],
        key: "services",
        title: "Servicii",
      },
    ],
  },
  {
    defaultContent: {
      cards: {
        items: [
          { accent: "cream", body: servicePageContent.stopDieta.intro, title: "Recalibrare" },
          {
            accent: "default",
            body: servicePageContent.stopDieta.paragraphs[0] ?? "",
            title: "Program online",
          },
          {
            accent: "peach",
            body: servicePageContent.stopDieta.paragraphs[1] ?? "",
            title: "Abordare",
          },
        ],
      },
      hero: {
        accent: "peach",
        description: "",
        eyebrow: "",
        title: "Servicii Stop Dieta Online",
      },
    },
    label: "Stop Dieta Online",
    pageKey: "stop-dieta",
    route: "/stopdieta",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          {
            cardFields: [
              { label: "Titlu intern", maxLength: 120, name: "title", type: "text" },
              { label: "Text", maxLength: 1400, name: "body", type: "textarea" },
              { label: "Accent", name: "accent", type: "accentPreset" },
            ],
            label: "Carduri text",
            maxItems: 4,
            name: "items",
            type: "cards",
          },
        ],
        key: "cards",
        title: "Continut",
      },
    ],
  },
  {
    defaultContent: {
      content: {
        benefits: servicePageContent.detox.bullets,
        diagnosticsIntro:
          "vine deci in sprijinul programului de slabire Recalibrarea Raspunsului Hormonal avand un efect de STIMULARE METABOLICA prin:",
        intro: servicePageContent.detox.intro,
        title: "Detox Fiziologic",
        vitalfeldText:
          "este o procedura non-invaziva prin care putem face o curatenie interna eficienta, cu rezultate vizibile pe termen lung.",
      },
      hero: {
        accent: "sage",
        description: "",
        eyebrow: "",
        title: "Detox Fiziologic",
      },
    },
    label: "Detox Fiziologic",
    pageKey: "detox-fiziologic",
    route: "/detox",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu principal", maxLength: 160, name: "title", type: "text" },
          { label: "Intro", maxLength: 1400, name: "intro", type: "textarea" },
          { label: "Text Vitalfeld", maxLength: 700, name: "vitalfeldText", type: "textarea" },
          {
            label: "Intro Global Diagnostics",
            maxLength: 700,
            name: "diagnosticsIntro",
            type: "textarea",
          },
          { label: "Beneficii", maxItems: 8, name: "benefits", type: "list" },
        ],
        key: "content",
        title: "Continut",
      },
    ],
  },
  {
    defaultContent: {
      content: {
        benefits: [
          "Scanare completa a organelor si sistemelor corpului",
          "Detectarea deficientelor de functionare celulara",
          "Identificarea factorilor reali ce declanseaza boala",
          "Tratamente imediate in concordanta cu dezechilibrele constatate",
        ],
        closingParagraphs: [
          "Un medic, oricat de pregatit ar fi, nu poate sa verifice pe parcursul unei singure consultatii, toate structurile anatomice, sa evalueze relatii dintre organe si carentele de vitamine sau minerale sau sa gaseasca cauzele ascunse ale unui simptom si sa ofere un diagnostic imediat.",
          "Un medic care foloseste GLOBAL DIAGNOSTICS poate face asta, pentru ca afectiunile invizibile devin acum vizibile!",
        ],
        image: {
          alt: "Evaluare cu tehnologie Global Diagnostics",
          src: "/site/services/diagnosis-patient.jpg",
        },
        intro:
          "GLOBAL DIAGNOSTICS este un echipament medical aprobat si certificat CE, avand peste 2000 de utilizatori in Uniunea Europeana. A fost creat acum aproape 30 de ani in Elvetia, fiind dezvoltat permanent de cercetatori ai companiei Vitatec, in scopul masurarii si analizarii starii energetice a celulelor, organelor si sistemelor corpului uman precum si pentru corectarea deficientelor si blocajelor prin tratamente specifice.",
        paragraph:
          "Pentru a analiza starea energetica a organismului uman, GLOBAL DIAGNOSTICS transmite prin intermediul unor electrozi, microcurenti ce interactioneaza cu campurile bioelectrice specifice ale organelor corpului. Se efectueaza astfel peste 200 de milioane de masuratori la nivel celular comparandu-se raspunsurile energetice primite cu informatiile existente in baza de date a aparatului. Sunt astfel evidentiate carentele si nevoile organismului precum si alti factori care pot influenta negativ starea de sanatate.",
        subtitle: "Ce obtinem cu ajutorul diagnozei celulare?",
        title: "Diagnoza celulara",
      },
      hero: {
        accent: "sage",
        description: "",
        eyebrow: "",
        title: "Diagnoza celulara",
      },
    },
    label: "Diagnoza Celulara",
    pageKey: "diagnoza-celulara",
    route: "/diagnozacel",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu", maxLength: 160, name: "title", type: "text" },
          { label: "Intro", maxLength: 1400, name: "intro", type: "textarea" },
          { label: "Paragraf", maxLength: 1400, name: "paragraph", type: "textarea" },
          { label: "Subtitlu beneficii", maxLength: 180, name: "subtitle", type: "text" },
          { label: "Beneficii", maxItems: 8, name: "benefits", type: "list" },
          { label: "Paragrafe finale", maxItems: 4, name: "closingParagraphs", type: "list" },
          { label: "Imagine", name: "image", type: "image" },
        ],
        key: "content",
        title: "Continut",
      },
    ],
  },
  {
    defaultContent: {
      hero: {
        accent: "sage",
        description: "",
        eyebrow: "",
        title: shockwavePageContent.whatIs.title,
      },
      sections: {
        items: shockwavePageContent.whatIs.sections.map((section) => ({
          paragraphs: section.paragraphs,
          title: section.title,
        })),
      },
    },
    label: "Ce este Terapia Shockwave",
    pageKey: "shockwave-what-is",
    route: "/terapie-shockwave/ce-este-terapia-shockwave",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          {
            cardFields: [
              { label: "Titlu", maxLength: 180, name: "title", type: "text" },
              { label: "Paragrafe", maxItems: 5, name: "paragraphs", type: "list" },
            ],
            label: "Sectiuni",
            maxItems: 4,
            name: "items",
            type: "cards",
          },
        ],
        key: "sections",
        title: "Continut",
      },
    ],
  },
  {
    defaultContent: {
      content: {
        illustration: shockwavePageContent.whatWeTreat.illustration,
        indicationsIntro:
          "S-au obtinut rezultate foarte bune in urmatoarele domenii:",
        indicationsTitle: "Alte indicatii",
        intro: shockwavePageContent.whatWeTreat.intro,
        introTitle: "Ce putem trata?",
        treatments: shockwavePageContent.whatWeTreat.treatments,
      },
      hero: {
        accent: "sage",
        description: "",
        eyebrow: "",
        title: shockwavePageContent.whatWeTreat.title,
      },
    },
    label: "Ce putem trata",
    pageKey: "shockwave-what-we-treat",
    route: "/terapie-shockwave/ce-putem-trata",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu intro", maxLength: 160, name: "introTitle", type: "text" },
          { label: "Imagine", name: "illustration", type: "image" },
          { label: "Intro", maxLength: 900, name: "intro", type: "textarea" },
          {
            label: "Titlu indicatii",
            maxLength: 160,
            name: "indicationsTitle",
            type: "text",
          },
          {
            label: "Intro indicatii",
            maxLength: 500,
            name: "indicationsIntro",
            type: "textarea",
          },
          { label: "Tratamente", maxItems: 10, name: "treatments", type: "list" },
        ],
        key: "content",
        title: "Continut",
      },
    ],
  },
  {
    defaultContent: {
      content: {
        sections: shockwavePageContent.treatmentMode.sections.map((section) => ({
          image: "image" in section ? section.image : { alt: "", src: "" },
          paragraphs: section.paragraphs,
        })),
        topParagraph: shockwavePageContent.treatmentMode.topParagraph,
        topTitle: "Mod Tratament",
      },
      hero: {
        accent: "sage",
        description: "",
        eyebrow: "",
        title: shockwavePageContent.treatmentMode.title,
      },
    },
    label: "Mod Tratament",
    pageKey: "shockwave-treatment-mode",
    route: "/terapie-shockwave/mod-tratament",
    sections: [
      { fields: heroFields, key: "hero", title: "Hero" },
      {
        fields: [
          { label: "Titlu intro", maxLength: 160, name: "topTitle", type: "text" },
          { label: "Intro", maxLength: 900, name: "topParagraph", type: "textarea" },
          {
            cardFields: [
              { label: "Imagine", name: "image", type: "image" },
              { label: "Paragrafe", maxItems: 5, name: "paragraphs", type: "list" },
            ],
            label: "Sectiuni tratament",
            maxItems: 5,
            name: "sections",
            type: "cards",
          },
        ],
        key: "content",
        title: "Continut",
      },
    ],
  },
];

export const editableCmsPages = cmsPageDefinitions.map((page) => ({
  label: page.label,
  pageKey: page.pageKey,
  route: page.route,
}));

export function getCmsPageDefinition(pageKey: string) {
  return cmsPageDefinitions.find((page) => page.pageKey === pageKey) ?? null;
}

export function getCmsPageRoute(pageKey: string) {
  return getCmsPageDefinition(pageKey)?.route ?? (pageKey === "home" ? "/" : `/${pageKey}`);
}

export function cloneCmsContent(content: CmsPageContent): CmsPageContent {
  return JSON.parse(JSON.stringify(content)) as CmsPageContent;
}
