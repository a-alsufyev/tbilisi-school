import { parseInstructionLanguages, type InstructionLanguage } from "../admin/languages";
import {
  districtAt,
  DISTRICT_LABELS,
  resolveArea,
  resolveDistrictId,
  type AreaMatch,
  type DistrictId,
  type DistrictLabels,
} from "./districts";
import { costBoundOf, costCurrencyOf, costPeriodOf, costStatusOf } from "./cost";
import type { GelPerCurrency } from "./exchange-rates";
import type { CostCurrency, School } from "../types";

export type PriceCurrency = "USD" | "EUR" | "GEL";
export type PricePeriod = "year" | "month";

export type PriceConstraint = {
  amount: number;
  currency: PriceCurrency;
  period: PricePeriod;
};

export type PriceRank = "cheapest" | "expensive";

export type SchoolSearchFilters = {
  languages?: string[];
  program?: string;
  district?: string;
  area?: string;
  minPrice?: PriceConstraint;
  maxPrice?: PriceConstraint;
  priceRank?: PriceRank;
};

export type AssistantSchool = School & { district: DistrictId | null };

export type SchoolMatch = {
  school: AssistantSchool;
  priceUncertain: boolean;
};

export type SchoolSearchResult = {
  matches: SchoolMatch[];
  unknownDistrict: boolean;
  outsideDistrict: AssistantSchool[];
  area: AreaMatch | null;
  priceRank: { kind: PriceRank; considered: number; shown: number } | null;
};

const PROGRAM_GROUPS: { keys: string[]; pattern: RegExp }[] = [
  { keys: ["ib"], pattern: /\bib\b/i },
  { keys: ["british", "uk", "британ", "britisch"], pattern: /british|британ|britisch/i },
  { keys: ["american", "us", "usa", "американ"], pattern: /american|us curriculum|\bus\b|американ/i },
  {
    keys: ["national", "националь", "грузин", "georgian", "ქართ"],
    pattern: /националь|national|грузин|georgian/i,
  },
  { keys: ["german", "немец", "deutsch", "გერმან"], pattern: /немец|german|deutsch/i },
  { keys: ["finnish", "финск", "finnisch"], pattern: /финск|finnish|finnisch/i },
  { keys: ["private", "частн", "privat"], pattern: /частн|private|privat/i },
  { keys: ["alternative", "альтернатив"], pattern: /alternative|альтернатив/i },
  { keys: ["cambridge", "кембридж"], pattern: /cambridge|кембридж/i },
];

export function parseCoordinates(value: string): { lat: number; lng: number } | null {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function attachDistrict(school: School): AssistantSchool {
  const point = parseCoordinates(school.coordinates);
  return { ...school, district: point ? districtAt(point.lat, point.lng) : null };
}

function annual(amount: number, period: PricePeriod): number {
  return period === "month" ? amount * 10 : amount;
}

function yearlyInCurrency(
  amount: number,
  from: CostCurrency,
  period: PricePeriod,
  to: CostCurrency,
  rates: GelPerCurrency | null
): number | null {
  const yearly = annual(amount, period);
  if (from === to) return yearly;
  if (!rates) return null;
  return (yearly * rates[from]) / rates[to];
}

export function priceFit(
  school: School,
  minPrice?: PriceConstraint,
  maxPrice?: PriceConstraint,
  rates: GelPerCurrency | null = null
): "match" | "miss" | "uncertain" {
  if (!minPrice && !maxPrice) return "match";
  if (costStatusOf(school) === "unknown") return "uncertain";
  const currency = costCurrencyOf(school);
  const low = costBoundOf(school, "min");
  const high = costBoundOf(school, "max");
  if (!currency || (low == null && high == null)) return "uncertain";
  const currencies = [minPrice?.currency, maxPrice?.currency].filter(Boolean);
  if (new Set(currencies).size > 1) return "uncertain";
  const target = (minPrice?.currency ?? maxPrice?.currency) as CostCurrency;
  const period = costPeriodOf(school) ?? "year";
  const schoolMin = yearlyInCurrency(low ?? (high as number), currency, period, target, rates);
  const schoolMax = yearlyInCurrency(high ?? (low as number), currency, period, target, rates);
  if (schoolMin == null || schoolMax == null) return "uncertain";
  if (maxPrice && schoolMax > annual(maxPrice.amount, maxPrice.period)) return "miss";
  if (minPrice && schoolMin < annual(minPrice.amount, minPrice.period)) return "miss";
  return "match";
}

function mentionsToken(needle: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "iu").test(needle);
}

export function programsMatch(labels: readonly string[] | undefined, query: string): boolean {
  return (labels ?? []).some((label) => programMatches(label, query));
}

export function programMatches(field: string | undefined, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const value = field ?? "";
  if (value.toLowerCase().includes(needle)) return true;
  for (const group of PROGRAM_GROUPS) {
    if (group.keys.some((key) => mentionsToken(needle, key))) return group.pattern.test(value);
  }
  return false;
}

const LANGUAGE_WORDS: { pattern: RegExp; code: InstructionLanguage }[] = [
  { pattern: /english|englisch|английск|англоязыч|ინგლისურ/iu, code: "EN" },
  { pattern: /russian|russisch|русск|რუსულ/iu, code: "RU" },
  { pattern: /georgian|georgisch|грузин|ქართულ/iu, code: "GE" },
  { pattern: /german|deutsch|немец|გერმანულ/iu, code: "DE" },
  { pattern: /french|französisch|franzoesisch|француз|ფრანგულ/iu, code: "FR" },
];

function wantedLanguages(codes: string[] | undefined): InstructionLanguage[] {
  if (!codes || codes.length === 0) return [];
  const found = new Set<InstructionLanguage>();
  for (const code of codes) {
    const token = code.trim();
    if (!token) continue;
    if (token.length <= 3) {
      for (const parsed of parseInstructionLanguages(token)) found.add(parsed);
      continue;
    }
    const fromWords = LANGUAGE_WORDS.find((item) => item.pattern.test(token));
    if (fromWords) found.add(fromWords.code);
    else for (const parsed of parseInstructionLanguages(token)) found.add(parsed);
  }
  return [...found];
}

export function districtLabels(id: DistrictId): DistrictLabels {
  return DISTRICT_LABELS[id];
}

export function searchSchools(
  schools: School[],
  filters: SchoolSearchFilters,
  rates: GelPerCurrency | null = null
): SchoolSearchResult {
  const languages = wantedLanguages(filters.languages);
  const program = filters.program?.trim() ?? "";
  const districtRaw = filters.district?.trim() ?? "";
  const areaRaw = filters.area?.trim() ?? "";
  let districtIds: DistrictId[] | null = null;
  let area: AreaMatch | null = null;
  if (districtRaw) {
    const district = resolveDistrictId(districtRaw);
    if (district) {
      districtIds = [district];
    } else {
      area = resolveArea(districtRaw);
      if (!area) return { matches: [], unknownDistrict: true, outsideDistrict: [], area: null, priceRank: null };
      districtIds = [...area.districts];
    }
  } else if (areaRaw) {
    area = resolveArea(areaRaw);
    if (!area) return { matches: [], unknownDistrict: true, outsideDistrict: [], area: null, priceRank: null };
    districtIds = [...area.districts];
  }

  const matches: SchoolMatch[] = [];
  const outsideDistrict: AssistantSchool[] = [];
  const tracksOutside =
    languages.length > 0 || Boolean(program) || Boolean(filters.minPrice) || Boolean(filters.maxPrice);

  for (const school of schools) {
    const withDistrict = attachDistrict(school);
    if (languages.length > 0) {
      const have = new Set(parseInstructionLanguages(school.languages));
      if (!languages.every((code) => have.has(code))) continue;
    }
    if (program && !programsMatch(school.programs, program)) continue;

    const fit = priceFit(school, filters.minPrice, filters.maxPrice, rates);
    if (fit === "miss") continue;

    if (districtIds) {
      if (withDistrict.district === null) {
        if (tracksOutside) outsideDistrict.push(withDistrict);
        continue;
      }
      if (!districtIds.includes(withDistrict.district)) continue;
    }

    matches.push({ school: withDistrict, priceUncertain: fit === "uncertain" });
  }

  const priceRank = rankByPrice(matches, filters.priceRank, rates);
  return {
    matches: priceRank?.matches ?? matches,
    unknownDistrict: false,
    outsideDistrict,
    area,
    priceRank: priceRank ? { kind: priceRank.kind, considered: priceRank.considered, shown: priceRank.shown } : null,
  };
}

function comparableBound(school: School, rank: PriceRank, rates: GelPerCurrency | null): number | null {
  if (costStatusOf(school) === "unknown") return null;
  const currency = costCurrencyOf(school);
  const preferred = costBoundOf(school, rank === "cheapest" ? "min" : "max");
  const fallback = costBoundOf(school, rank === "cheapest" ? "max" : "min");
  const amount = preferred ?? fallback;
  if (!currency || amount == null) return null;
  return yearlyInCurrency(amount, currency, costPeriodOf(school) ?? "year", "GEL", rates);
}

function rankByPrice(
  matches: SchoolMatch[],
  rank: PriceRank | undefined,
  rates: GelPerCurrency | null
): { kind: PriceRank; matches: SchoolMatch[]; considered: number; shown: number } | null {
  if (rank !== "cheapest" && rank !== "expensive") return null;
  const priced = matches.flatMap((match) => {
    const amount = comparableBound(match.school, rank, rates);
    return amount == null ? [] : [{ match, amount }];
  });
  priced.sort((left, right) => {
    const delta = rank === "cheapest" ? left.amount - right.amount : right.amount - left.amount;
    if (delta !== 0) return delta;
    return left.match.school.slug.localeCompare(right.match.school.slug);
  });
  const shown = priced.length === 0 ? 0 : Math.max(1, Math.round(priced.length / 3));
  return { kind: rank, matches: priced.slice(0, shown).map((item) => item.match), considered: priced.length, shown };
}

const MAX_COMPARE = 4;

function foldName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function schoolNames(school: School): string[] {
  return [school.name, school.names.en, school.names.ru, school.names.ge, school.names.de]
    .map(foldName)
    .filter(Boolean);
}

function nameWords(value: string): string[] {
  return foldName(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3);
}

function nameCovers(name: string, needle: string): boolean {
  if (!name || !needle) return false;
  if (name.includes(needle) || needle.includes(name)) return true;
  const words = nameWords(needle);
  return words.length > 0 && words.every((word) => name.includes(word));
}

export function resolveSchool(catalog: School[], query: string, used: Set<string>): School | null {
  const needle = foldName(query).replace(/^\[|\]$/g, "");
  if (!needle) return null;
  const variants = [needle];
  const withoutNotes = needle.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (withoutNotes && withoutNotes !== needle) variants.push(withoutNotes);

  const available = catalog.filter((school) => !used.has(school.id));
  const bySlug = available.find((school) => variants.includes(school.slug));
  if (bySlug) return bySlug;
  const exact = available.find((school) => schoolNames(school).some((name) => variants.includes(name)));
  if (exact) return exact;
  if (needle.length < 3) return null;
  const partial = available.filter((school) =>
    schoolNames(school).some((name) => variants.some((variant) => nameCovers(name, variant)))
  );
  if (partial.length === 0) return null;
  partial.sort((left, right) => {
    const leftStarts = schoolNames(left).some((name) => variants.some((variant) => name.startsWith(variant))) ? 0 : 1;
    const rightStarts = schoolNames(right).some((name) => variants.some((variant) => name.startsWith(variant))) ? 0 : 1;
    if (leftStarts !== rightStarts) return leftStarts - rightStarts;
    return left.name.length - right.name.length;
  });
  return partial[0];
}

export function compareSchools(
  catalog: School[],
  queries: string[]
): { matched: AssistantSchool[]; missing: string[]; truncated: boolean } {
  const cleaned = queries.map((query) => query.trim()).filter(Boolean);
  const truncated = cleaned.length > MAX_COMPARE;
  const matched: AssistantSchool[] = [];
  const missing: string[] = [];
  const used = new Set<string>();

  for (const query of cleaned.slice(0, MAX_COMPARE)) {
    const school = resolveSchool(catalog, query, used);
    if (!school) {
      missing.push(query);
      continue;
    }
    used.add(school.id);
    matched.push(attachDistrict(school));
  }

  return { matched, missing, truncated };
}
