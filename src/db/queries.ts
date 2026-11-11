import { asc, desc, eq, sql } from "drizzle-orm";
import { costBoundOf, costCurrencyOf, costPeriodOf, costYearOf, isCostStatus } from "../lib/cost";
import { isSupportedUiLang } from "../lib/schools";
import { db } from "./index";
import { listLookupLinks, lookupLabelsForSchool } from "./lookup-queries";
import { schools, schoolTranslations, visitDaily } from "./schema";
import type { School } from "../types";

export async function listSchools(): Promise<School[]> {
  const rows = await db.select().from(schools);
  const translations = await db.select().from(schoolTranslations);
  const lookupLinks = await listLookupLinks();

  const bySchool = new Map<string, { en: string; ru: string; ge: string; de: string }>();
  for (const row of translations) {
    const current = bySchool.get(row.schoolId) ?? { en: "", ru: "", ge: "", de: "" };
    if (row.locale === "en" || row.locale === "ru" || row.locale === "ge" || row.locale === "de") {
      current[row.locale] = row.name;
    }
    bySchool.set(row.schoolId, current);
  }

  return rows.map((row) => {
    const names = bySchool.get(row.id) ?? { en: "", ru: "", ge: "", de: "" };
    const nameLocale = isSupportedUiLang(row.nameLocale) ? row.nameLocale : "en";
    const labels = lookupLabelsForSchool(lookupLinks, row.id);
    const coordinates =
      row.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "";
    return {
      id: row.id,
      slug: row.slug,
      name: names[nameLocale]?.trim() || names.en || names.ru || row.slug,
      nameLocale,
      names,
      address: row.address,
      coordinates,
      languages: row.languages,
      website: row.website ?? undefined,
      costStatus: isCostStatus(row.costStatus) ? row.costStatus : costBoundOf(row, "min") || costBoundOf(row, "max") ? "approximate" : "unknown",
      costMin: costBoundOf(row, "min"),
      costMax: costBoundOf(row, "max"),
      costCurrency: costCurrencyOf(row),
      costYear: costYearOf(row),
      costPeriod: costPeriodOf(row),
      programs: labels.program,
      internationalStatuses: labels.international_status,
      accreditations: labels.accreditation,
    };
  });
}

export async function getSchoolDescription(
  slug: string,
  locale: string
): Promise<string | null> {
  const [school] = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
  if (!school) return null;

  const rows = await db
    .select()
    .from(schoolTranslations)
    .where(eq(schoolTranslations.schoolId, school.id));

  const match = rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en");
  return match ? match.description : "";
}

export type VisitCountryCount = { code: string; count: number };
export type VisitDay = { day: string; countries: VisitCountryCount[] };

export async function incrementVisitCount(day: string, country: string): Promise<void> {
  await db
    .insert(visitDaily)
    .values({ day, country, count: 1 })
    .onConflictDoUpdate({
      target: [visitDaily.day, visitDaily.country],
      set: { count: sql`${visitDaily.count} + 1` },
    });
}

export async function listVisitDays(): Promise<VisitDay[]> {
  const rows = await db
    .select({
      day: visitDaily.day,
      country: visitDaily.country,
      count: visitDaily.count,
    })
    .from(visitDaily)
    .orderBy(desc(visitDaily.day), desc(visitDaily.count), asc(visitDaily.country));

  const days: VisitDay[] = [];
  for (const row of rows) {
    const last = days.at(-1);
    if (!last || last.day !== row.day) {
      days.push({ day: row.day, countries: [{ code: row.country, count: row.count }] });
      continue;
    }
    last.countries.push({ code: row.country, count: row.count });
  }
  return days;
}
