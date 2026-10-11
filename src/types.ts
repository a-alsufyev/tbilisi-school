export type CostStatus = "official" | "approximate" | "unknown";
export type CostPeriod = "month" | "year";
export type CostCurrency = "USD" | "EUR" | "GEL";

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
  costStatus: CostStatus;
  costMin: number | null;
  costMax: number | null;
  costCurrency: CostCurrency | null;
  costYear: number | null;
  costPeriod: CostPeriod | null;
  program?: string;
  comment?: string;
  district?: string | null;
}

export interface Config {
  yandexMapsApiKey: string;
}
