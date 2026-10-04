import { School } from "../types";
import { normalizeUiLanguage } from "../lib/schools";

export function primarySchoolName(school: School): string {
  const locale = school.nameLocale ?? "en";
  return school.names?.[locale]?.trim() || school.name;
}

export function localeSchoolName(school: School, currentLang: string): string {
  const local = school.names?.[normalizeUiLanguage(currentLang)]?.trim() ?? "";
  if (!local || local === primarySchoolName(school)) return "";
  return local;
}

export function localizedSchoolName(school: School, currentLang: string): string {
  const lang = normalizeUiLanguage(currentLang);
  return school.names?.[lang] || school.names?.en || school.names?.ru || school.name;
}
