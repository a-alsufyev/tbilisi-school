import { isCostStatus } from "../lib/cost";
import { isSafeSchoolIdentifier } from "../lib/schools";
import { externalHref } from "../lib/website";
import { formatInstructionLanguages, parseInstructionLanguages } from "./languages";
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
    ? source.languages.filter((item): item is string => typeof item === "string").join("/")
    : typeof source.languages === "string"
      ? source.languages
      : "";
  const languages = formatInstructionLanguages(parseInstructionLanguages(languageSource));

  const websiteRaw = typeof source.website === "string" ? source.website.trim() : "";
  const website = websiteRaw ? externalHref(websiteRaw) : null;
  if (websiteRaw && !website) fields.website = "Укажите адрес сайта, например school.ge";

  const costText = typeof source.cost === "string" ? source.cost.trim() : "";
  const rawCostStatus = typeof source.costStatus === "string" ? source.costStatus : "";
  const costStatus = isCostStatus(rawCostStatus) ? rawCostStatus : costText ? "approximate" : "unknown";
  const cost = costStatus === "unknown" ? "" : costText;
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
      cost: cost || null,
      costStatus,
      program: program || null,
      nameLocale,
      translations,
    },
  };
}

export function isAdminLocale(value: string): value is AdminLocale {
  return (ADMIN_LOCALES as readonly string[]).includes(value);
}
