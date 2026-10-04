import type { CostStatus } from "../types";

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
  cost: string | null;
  costStatus: CostStatus;
  program: string | null;
  nameLocale: AdminLocale;
  translations: Record<AdminLocale, AdminTranslation>;
};

export type AdminSchool = AdminSchoolInput & {
  id: string;
  lat: number | null;
  lng: number | null;
};

export type AdminField = "slug" | "address" | "names" | "website";
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
