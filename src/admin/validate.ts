import { isCostCurrency, isCostPeriod, isCostStatus, isCostYear } from "../lib/cost";
import { isSafeSchoolIdentifier } from "../lib/schools";
import { externalHref } from "../lib/website";
import { normalizeInstructionLanguages } from "./languages";
import {
  ADMIN_LOCALES,
  blankTranslations,
  type AdminFieldErrors,
  type AdminLocale,
  type AdminSchoolInput,
} from "./types";

export const SLUG_TAKEN_MESSAGE = "Такой адрес уже занят";

export function validateSchoolInput(
  body: unknown
): { ok: true; value: AdminSchoolInput } | { ok: false; fields: AdminFieldErrors } {
  const fields: AdminFieldErrors = {};
  const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const slug = typeof source.slug === "string" ? source.slug.trim() : "";
  if (slug && !isSafeSchoolIdentifier(slug)) fields.slug = "Только латиница, цифры и дефис";

  const address = typeof source.address === "string" ? source.address.trim() : "";
  if (!address) fields.address = "Укажите адрес";

  const languageSource = Array.isArray(source.languages)
    ? source.languages.filter((item): item is string => typeof item === "string").join(", ")
    : typeof source.languages === "string"
      ? source.languages
      : "";
  const languages = normalizeInstructionLanguages(languageSource);

  const websiteRaw = typeof source.website === "string" ? source.website.trim() : "";
  const website = websiteRaw ? externalHref(websiteRaw) : null;
  if (websiteRaw && !website) fields.website = "Укажите адрес сайта, например school.ge";

  const rawCostStatus = typeof source.costStatus === "string" ? source.costStatus : "";
  const costStatus = isCostStatus(rawCostStatus) ? rawCostStatus : "unknown";
  const readAmount = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const amount = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    return Number.isFinite(amount) ? amount : Number.NaN;
  };
  let costMin = costStatus === "unknown" ? null : readAmount(source.costMin);
  let costMax = costStatus === "unknown" ? null : readAmount(source.costMax);
  if (costMin != null && (Number.isNaN(costMin) || costMin <= 0)) {
    fields.cost = "Укажите сумму больше нуля";
    costMin = null;
  }
  if (!fields.cost && costMax != null && (Number.isNaN(costMax) || costMax <= 0)) {
    fields.cost = "Укажите сумму больше нуля";
    costMax = null;
  }
  if (!fields.cost && costMin != null && costMax != null && costMin > costMax) {
    fields.cost = "«От» не может быть больше «До»";
  }
  const rawCurrency = typeof source.costCurrency === "string" ? source.costCurrency : "";
  let costCurrency = costStatus !== "unknown" && isCostCurrency(rawCurrency) ? rawCurrency : null;
  if (!fields.cost && costStatus !== "unknown" && (costMin != null || costMax != null) && !costCurrency) {
    fields.cost = "Выберите валюту";
  }
  if (costMin == null && costMax == null) costCurrency = null;
  const rawCostYear = source.costYear;
  let costYear: number | null = null;
  if (costStatus !== "unknown" && rawCostYear !== null && rawCostYear !== undefined && rawCostYear !== "") {
    const year = typeof rawCostYear === "number" ? rawCostYear : Number(rawCostYear);
    if (!isCostYear(year)) fields.costYear = "Выберите год, начиная с 2022";
    else costYear = year;
  }
  const rawCostPeriod = typeof source.costPeriod === "string" ? source.costPeriod : "";
  const costPeriod = costStatus !== "unknown" && isCostPeriod(rawCostPeriod) ? rawCostPeriod : null;
  const program = typeof source.program === "string" ? source.program.trim() : "";

  const translations = blankTranslations();
  const rawTranslations =
    source.translations && typeof source.translations === "object"
      ? (source.translations as Record<string, unknown>)
      : {};
  for (const locale of ADMIN_LOCALES) {
    const item = rawTranslations[locale];
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    translations[locale] = {
      name: typeof record.name === "string" ? record.name.trim() : "",
      description: typeof record.description === "string" ? record.description.trim() : "",
    };
  }
  const rawNameLocale = typeof source.nameLocale === "string" ? source.nameLocale : "en";
  const nameLocale: AdminLocale = isAdminLocale(rawNameLocale) ? rawNameLocale : "en";
  if (!translations[nameLocale].name) {
    fields.names = "Укажите основное название";
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      slug,
      address,
      languages,
      website,
      costStatus,
      costMin,
      costMax,
      costCurrency,
      costYear,
      costPeriod,
      program: program || null,
      nameLocale,
      translations,
    },
  };
}

export function isAdminLocale(value: string): value is AdminLocale {
  return (ADMIN_LOCALES as readonly string[]).includes(value);
}
