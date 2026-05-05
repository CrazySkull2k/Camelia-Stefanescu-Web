function toCategoryKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type AnalysisUploadCategory = {
  key: string;
  label: string;
  description: string;
};

export type AnalysisUploadGroup = {
  key: string;
  title: string;
  description: string;
  categories: AnalysisUploadCategory[];
};

export const requiredAnalyses = [
  {
    title: "Hemoleucograma completa",
    details: [],
  },
  {
    title: "Ionograma serica",
    details: ["Sodiu, clor, calciu, fosfor, potasiu, fier, magneziu"],
  },
  {
    title: "Analiza functiei pancreatice",
    details: ["Glicemie, insulinemie, amilaza"],
  },
  {
    title: "Profil lipidic si functie hepatica",
    details: [
      "LDL colesterol, HDL, VLDL",
      "Albumina serica, electroforeza",
      "Alaninaminotransferaza (GPT / ALAT / ALT)",
      "Aspartataminotransferaza (GOT / ASAT / AST)",
      "GGT",
      "Fibrinogen",
      "Fosfataza alcalina",
      "Trigliceride, lipide, proteine",
    ],
  },
  {
    title: "Profil functional renal",
    details: ["Creatinina, uree serica, acid uric"],
  },
  {
    title: "Imunitate",
    details: ["25-OH Vitamina D"],
  },
  {
    title: "Anemie feripriva",
    details: ["Feritina, Sideremie, Transferina"],
  },
] as const;

export const specificAnalyses = [
  {
    title: "Afectiuni inflamatorii acute sau cronice",
    description: "Boala Crohn, poliartrita reumatoida",
    details: ["Proteina C reactiva, titru ASLO, VSH, creatinkinaza"],
  },
  {
    title: "Antecedente patologice tiroidiene sau boli autoimune",
    description: "",
    details: ["fT3, fT4, TSH, ATG, ATPO, cortizol"],
  },
  {
    title: "Infectii urinare frecvente",
    description: "",
    details: ["Sumar de urina, pH urinar, urocultura"],
  },
  {
    title: "Boli cardiovasculare",
    description: "HTA, IC, IM, fibrilatie atriala",
    details: [
      "Troponina, CK-MB",
      "Proteina C reactiva inalt sensibila (hsCRP)",
      "NT-proBNP",
    ],
  },
] as const;

export const analysisUploadGroups: AnalysisUploadGroup[] = [
  {
    key: "obligatorii",
    title: "Analize obligatorii",
    description: "Incarca rezultatele de baza cerute pentru prima consultatie.",
    categories: requiredAnalyses.map((item) => ({
      key: toCategoryKey(item.title),
      label: item.title,
      description: item.details.join(", "),
    })),
  },
  {
    key: "specifice",
    title: "Analize specifice",
    description:
      "Foloseste aceste categorii daca medicul le-a recomandat pentru cazul tau.",
    categories: specificAnalyses.map((item) => ({
      key: toCategoryKey(item.title),
      label: item.title,
      description: item.description || item.details.join(", "),
    })),
  },
] satisfies AnalysisUploadGroup[];

export const analysisUploadCategories = analysisUploadGroups.flatMap(
  (group) => group.categories,
);

export const supportTopics = [
  "Programari si reprogramari",
  "Status evaluare nutritionala si documente",
  "Analize necesare pentru consult",
  "Intrebari despre profil si cont",
] as const;
