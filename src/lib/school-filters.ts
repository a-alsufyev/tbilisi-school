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
import { costStatusOf } from "./cost";
import type { School } from "../types";

export type PriceCurrency = "USD" | "EUR" | "GEL";
export type PricePeriod = "year" | "month";

export type PriceConstraint = {
  amount: number;
  currency: PriceCurrency;
  period: PricePeriod;
};

export type SchoolSearchFilters = {
  languages?: string[];
  program?: string;
  district?: string;
  area?: string;
  minPrice?: PriceConstraint;
  maxPrice?: PriceConstraint;
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
};

type ParsedCost = {
  min: number;
  max: number;
  currency: PriceCurrency;
  period: PricePeriod;
};

const CURRENCIES: { pattern: RegExp; currency: PriceCurrency }[] = [
  { pattern: /usd|\$|dollar/i, currency: "USD" },
  { pattern: /eur|€/i, currency: "EUR" },
  { pattern: /gel|lari|ლარი/i, currency: "GEL" },
];

const MONTHLY =
  /(\/\s*mon(th)?)|(\/\s*мес)|(\bмес\b)|თვ|monthly|per month|в месяц/i;

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

export function parseCost(raw: string | undefined): ParsedCost | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  const currency = CURRENCIES.find((item) => item.pattern.test(text))?.currency;
  if (!currency) return null;
  const amounts = [...text.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((item) => Number(item[0].replace(",", ".")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  if (amounts.length === 0) return null;
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    currency,
    period: MONTHLY.test(text) ? "month" : "year",
  };
}

function annual(amount: number, period: PricePeriod): number {
  return period === "month" ? amount * 10 : amount;
}

export function priceFit(
  cost: string | undefined,
  minPrice?: PriceConstraint,
  maxPrice?: PriceConstraint
): "match" | "miss" | "uncertain" {
  if (!minPrice && !maxPrice) return "match";
  const parsed = parseCost(cost);
  if (!parsed) return "uncertain";
  const currencies = [minPrice?.currency, maxPrice?.currency].filter(Boolean);
  if (new Set(currencies).size > 1) return "uncertain";
  if (parsed.currency !== currencies[0]) return "uncertain";
  const schoolMin = annual(parsed.min, parsed.period);
  const schoolMax = annual(parsed.max, parsed.period);
  if (maxPrice && schoolMax > annual(maxPrice.amount, maxPrice.period)) return "miss";
  if (minPrice && schoolMin < annual(minPrice.amount, minPrice.period)) return "miss";
  return "match";
}

function mentionsToken(needle: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "iu").test(needle);
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

export function searchSchools(schools: School[], filters: SchoolSearchFilters): SchoolSearchResult {
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
      if (!area) return { matches: [], unknownDistrict: true, outsideDistrict: [], area: null };
      districtIds = [...area.districts];
    }
  } else if (areaRaw) {
    area = resolveArea(areaRaw);
    if (!area) return { matches: [], unknownDistrict: true, outsideDistrict: [], area: null };
    districtIds = [...area.districts];
  }

  const matches: SchoolMatch[] = [];
  const outsideDistrict: AssistantSchool[] = [];

  for (const school of schools) {
    const withDistrict = attachDistrict(school);
    if (languages.length > 0) {
      const have = new Set(parseInstructionLanguages(school.languages));
      if (!languages.every((code) => have.has(code))) continue;
    }
    if (program && !programMatches(school.program, program)) continue;

    const fit = priceFit(costStatusOf(school) === "unknown" ? undefined : school.cost, filters.minPrice, filters.maxPrice);
    if (fit === "miss") continue;

    if (districtIds) {
      if (withDistrict.district === null) {
        outsideDistrict.push(withDistrict);
        continue;
      }
      if (!districtIds.includes(withDistrict.district)) continue;
    }

    matches.push({ school: withDistrict, priceUncertain: fit === "uncertain" });
  }

  return { matches, unknownDistrict: false, outsideDistrict, area };
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
