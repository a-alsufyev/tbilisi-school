export type CostStatus = "official" | "approximate" | "unknown";

export interface SchoolNames {
  en: string;
  ru: string;
  ge: string;
  de: string;
}

export interface School {
  id: string;
  slug: string;
  name: string;
  nameLocale: "en" | "ru" | "ge" | "de";
  names: SchoolNames;
  address: string;
  coordinates: string;
  languages: string;
  website?: string;
  cost?: string;
  costStatus: CostStatus;
  program?: string;
  comment?: string;
  district?: string | null;
}

export interface Config {
  yandexMapsApiKey: string;
}
