import type { CostCurrency, CostPeriod, CostStatus, School } from "../types";

export const COST_STATUSES = ["official", "approximate", "unknown"] as const satisfies readonly CostStatus[];
export const COST_PERIODS = ["month", "year"] as const satisfies readonly CostPeriod[];
export const COST_CURRENCIES = ["USD", "EUR", "GEL"] as const satisfies readonly CostCurrency[];

export function isCostStatus(value: string): value is CostStatus {
  return (COST_STATUSES as readonly string[]).includes(value);
}

export function isCostPeriod(value: string): value is CostPeriod {
  return (COST_PERIODS as readonly string[]).includes(value);
}

export function isCostCurrency(value: string): value is CostCurrency {
  return (COST_CURRENCIES as readonly string[]).includes(value);
}

export const COST_YEAR_MIN = 2022;

export function maxCostYear(now = new Date()): number {
  return now.getFullYear() + 1;
}

export function costYearOptions(now = new Date()): number[] {
  const years: number[] = [];
  for (let year = maxCostYear(now); year >= COST_YEAR_MIN; year -= 1) years.push(year);
  return years;
}

export function isCostYear(value: number, now = new Date()): boolean {
  return Number.isInteger(value) && value >= COST_YEAR_MIN && value <= maxCostYear(now);
}

type CostFields = {
  costStatus?: string | null;
  costMin?: number | null;
  costMax?: number | null;
  costCurrency?: string | null;
  costYear?: number | null;
  costPeriod?: string | null;
};

function positiveAmount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function hasCostAmount(school: CostFields): boolean {
  return positiveAmount(school.costMin) != null || positiveAmount(school.costMax) != null;
}

export function costStatusOf(school: CostFields): CostStatus {
  if (school.costStatus && isCostStatus(school.costStatus)) return school.costStatus;
  return hasCostAmount(school) ? "approximate" : "unknown";
}

export function costYearOf(school: CostFields): number | null {
  if (costStatusOf(school) === "unknown") return null;
  const year = school.costYear;
  if (typeof year !== "number" || !isCostYear(year)) return null;
  return year;
}

export function costPeriodOf(school: CostFields): CostPeriod | null {
  if (costStatusOf(school) === "unknown") return null;
  const period = school.costPeriod;
  if (period && isCostPeriod(period)) return period;
  return null;
}

export function costCurrencyOf(school: CostFields): CostCurrency | null {
  if (costStatusOf(school) === "unknown") return null;
  const currency = school.costCurrency;
  if (currency && isCostCurrency(currency)) return currency;
  return null;
}

export function costBoundOf(school: CostFields, bound: "min" | "max"): number | null {
  if (costStatusOf(school) === "unknown") return null;
  return positiveAmount(bound === "min" ? school.costMin : school.costMax);
}

const LEGACY_CURRENCIES: { pattern: RegExp; currency: CostCurrency }[] = [
  { pattern: /usd|\$|dollar/i, currency: "USD" },
  { pattern: /eur|€/i, currency: "EUR" },
  { pattern: /gel|lari|ლარი/i, currency: "GEL" },
];

export function parseLegacyCost(
  raw: string | null | undefined
): { min: number; max: number; currency: CostCurrency } | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  const currency = LEGACY_CURRENCIES.find((item) => item.pattern.test(text))?.currency;
  if (!currency) return null;
  const amounts = [...text.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((item) => Number(item[0].replace(",", ".")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  if (amounts.length === 0) return null;
  return { min: Math.min(...amounts), max: Math.max(...amounts), currency };
}

function formatAmountNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

export function formatCostFigures(
  school: CostFields,
  bounds: { from: string; to: string }
): string {
  if (costStatusOf(school) === "unknown") return "";
  const min = costBoundOf(school, "min");
  const max = costBoundOf(school, "max");
  const currency = costCurrencyOf(school);
  if (min == null && max == null) return "";
  let span: string;
  if (min != null && max != null && min !== max) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    span = `${formatAmountNumber(low)}–${formatAmountNumber(high)}`;
  } else if (min != null && max != null) {
    span = formatAmountNumber(min);
  } else if (min != null) {
    span = `${bounds.from} ${formatAmountNumber(min)}`;
  } else {
    span = `${bounds.to} ${formatAmountNumber(max as number)}`;
  }
  return currency ? `${span} ${currency}` : span;
}

export function formatCostAmount(
  school: CostFields,
  periodLabels: Record<CostPeriod, string>,
  bounds: { from: string; to: string }
): string {
  const figures = formatCostFigures(school, bounds);
  if (!figures) return "";
  const period = costPeriodOf(school);
  return period ? `${figures} ${periodLabels[period]}` : figures;
}

export function formatCostStatusText(
  school: CostFields,
  labels: Record<CostStatus, string>,
  withYear: (status: string, year: number) => string
): string {
  const status = costStatusOf(school);
  if (status === "unknown") return labels.unknown;
  const year = costYearOf(school);
  const label = labels[status];
  return year ? withYear(label, year) : label;
}

export function formatSchoolCost(
  school: Pick<School, "costStatus" | "costMin" | "costMax" | "costCurrency" | "costYear" | "costPeriod">,
  labels: Record<CostStatus, string>,
  withYear: (status: string, year: number) => string,
  periodLabels: Record<CostPeriod, string>,
  bounds: { from: string; to: string }
): string {
  const phrase = formatCostStatusText(school, labels, withYear);
  if (costStatusOf(school) === "unknown") return phrase;
  const amount = formatCostAmount(school, periodLabels, bounds);
  return amount ? `${amount} · ${phrase}` : phrase;
}
