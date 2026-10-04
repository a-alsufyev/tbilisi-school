/** Maps CSV/file slugs to stable Latin URL slugs. */
export const FILE_SLUG_TO_URL_SLUG: Record<string, string> = {
  american_international_school_progress: "american-international-school-progress",
  british_international_school_of_tbilisi: "british-international-school-of-tbilisi",
  projector_school: "projector-school",
  qsi_international_school: "qsi-international-school",
  newton_free_school: "newton-free-school",
  european_school_tbilisi: "european-school-tbilisi",
  international_school_of_georgia__new_school_: "international-school-of-georgia",
  buckswood_international_school: "buckswood-international-school",
  finnish_international_school: "finnish-international-school",
  интеллект_плюс: "intellect-plus",
  happy_school: "happy-school",
  globus_school: "globus-school",
  северная_школа: "northern-school",
  new_georgian_gymnasium: "new-georgian-gymnasium",
  german_international_school_tbilisi: "german-international-school-tbilisi",
  your_way_school: "your-way-school",
  british_georgian_academy: "british-georgian-academy",
};

export const LOCALES = ["en", "ru", "ge", "de"] as const;
export type Locale = (typeof LOCALES)[number];
