import { eq, sql } from "drizzle-orm";
import { isCostStatus } from "../lib/cost";
import { isSupportedUiLang } from "../lib/schools";
import { db } from "./index";
import { schools, schoolTranslations, siteStats } from "./schema";
import type { School } from "../types";

export async function listSchools(): Promise<School[]> {
  const rows = await db.select().from(schools);
  const translations = await db.select().from(schoolTranslations);

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
      cost: row.cost ?? undefined,
      costStatus: isCostStatus(row.costStatus) ? row.costStatus : row.cost ? "approximate" : "unknown",
      program: row.program ?? undefined,
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

export async function getVisitTotal(): Promise<number> {
  const [row] = await db.select().from(siteStats).where(eq(siteStats.key, "visits")).limit(1);
  return row?.value ?? 0;
}

export async function incrementVisitTotal(): Promise<number> {
  const rows = await db
    .insert(siteStats)
    .values({ key: "visits", value: 1 })
    .onConflictDoUpdate({
      target: siteStats.key,
      set: { value: sql`${siteStats.value} + 1` },
    })
    .returning({ value: siteStats.value });

  return rows[0]?.value ?? 1;
}
