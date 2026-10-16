import { parseInstructionLanguages, type InstructionLanguage } from "../admin/languages";
import { costStatusOf } from "./cost";
import { isDistrictId, type DistrictId } from "./districts";
import { schoolDistrictId } from "./cover";
import { confirmedInternationalStatuses } from "./lookups";
import type { School } from "../types";

export type CatalogQuery = {
  q: string;
  district: DistrictId | "";
  lang: InstructionLanguage | "";
  program: string;
  intl: boolean;
};

const LANG_CODES: InstructionLanguage[] = ["EN", "RU", "GE", "DE", "FR"];

export function readCatalogQuery(search: string): CatalogQuery {
  const params = new URLSearchParams(search);
  const lang = (params.get("lang") ?? "").toUpperCase();
  const district = params.get("district") ?? "";
  return {
    q: params.get("q")?.trim() ?? "",
    district: isDistrictId(district) ? district : "",
    lang: LANG_CODES.includes(lang as InstructionLanguage) ? (lang as InstructionLanguage) : "",
    program: params.get("program")?.trim() ?? "",
    intl: params.get("intl") === "1",
  };
}

export function catalogHref(prefix: string, query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.district) params.set("district", query.district);
  if (query.lang) params.set("lang", query.lang);
  if (query.program) params.set("program", query.program);
  if (query.intl) params.set("intl", "1");
  const qs = params.toString();
  return `${prefix}/schools${qs ? `?${qs}` : ""}`;
}

export function hasCatalogQuery(query: CatalogQuery): boolean {
  return Boolean(query.q || query.district || query.lang || query.program || query.intl);
}

function searchable(school: School): string {
  return [school.name, school.names.en, school.names.ru, school.names.ge, school.names.de, school.address, school.district]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterCatalog(schools: School[], query: CatalogQuery): School[] {
  const needle = query.q.toLowerCase();
  return schools.filter((school) => {
    if (needle && !searchable(school).includes(needle)) return false;
    if (query.district && schoolDistrictId(school) !== query.district) return false;
    if (query.lang && !parseInstructionLanguages(school.languages).includes(query.lang)) return false;
    if (query.program && !school.programs.includes(query.program)) return false;
    if (query.intl && confirmedInternationalStatuses(school.internationalStatuses).length === 0) return false;
    return true;
  });
}

export type HomeStats = {
  schools: number;
  languages: number;
  programs: number;
  priced: number;
};

export function computeStats(schools: School[]): HomeStats {
  const languages = new Set<string>();
  const programs = new Set<string>();
  let priced = 0;
  for (const school of schools) {
    for (const code of parseInstructionLanguages(school.languages)) languages.add(code);
    for (const program of school.programs) programs.add(program);
    if (costStatusOf(school) !== "unknown") priced += 1;
  }
  return { schools: schools.length, languages: languages.size, programs: programs.size, priced };
}

export function topPrograms(schools: School[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const school of schools) {
    for (const program of school.programs) counts.set(program, (counts.get(program) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([program]) => program);
}

export function countWhere(schools: School[], query: Partial<CatalogQuery>): number {
  return filterCatalog(schools, { q: "", district: "", lang: "", program: "", intl: false, ...query }).length;
}
