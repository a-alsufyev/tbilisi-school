import type { CostCurrency, CostPeriod, CostStatus } from "../types";

export const ADMIN_LOCALES = ["en", "ru", "ge", "de"] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];

export type AdminTranslation = {
  name: string;
  description: string;
};

export type AdminSchoolInput = {
  slug: string;
  address: string;
  languages: string;
  website: string | null;
  costStatus: CostStatus;
  costMin: number | null;
  costMax: number | null;
  costCurrency: CostCurrency | null;
  costYear: number | null;
  costPeriod: CostPeriod | null;
  programIds: string[];
  internationalStatusIds: string[];
  accreditationIds: string[];
  nameLocale: AdminLocale;
  translations: Record<AdminLocale, AdminTranslation>;
};

export type AdminSchool = AdminSchoolInput & {
  id: string;
  lat: number | null;
  lng: number | null;
};

export type AdminField = "slug" | "address" | "names" | "website" | "cost" | "costYear" | "lookups";
export type AdminFieldErrors = Partial<Record<AdminField, string>>;

export function blankTranslations(): Record<AdminLocale, AdminTranslation> {
  return {
    en: { name: "", description: "" },
    ru: { name: "", description: "" },
    ge: { name: "", description: "" },
    de: { name: "", description: "" },
  };
}

export function schoolLabel(
  school: Pick<AdminSchool, "slug" | "translations"> & { nameLocale?: AdminLocale }
): string {
  const primary = school.nameLocale ? school.translations[school.nameLocale].name : "";
  return primary || school.translations.ru.name || school.translations.en.name || school.slug;
}
