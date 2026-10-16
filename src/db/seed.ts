import fs from "fs";
import path from "path";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { lookupItems, schools, schoolLookupItems, schoolTranslations, siteStats } from "./schema";
import { parseLegacyCost } from "../lib/cost";
import { parseSchoolsCsv } from "./parse-csv";
import { FILE_SLUG_TO_URL_SLUG, LOCALES } from "./slug-map";

type NameEntry = { en: string; ru: string; ge: string; de: string };

function parseCoordinates(value: string): { lat: number | null; lng: number | null } {
  const parts = value.split(",").map((part) => parseFloat(part.trim()));
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return { lat: null, lng: null };
  }
  return { lat: parts[0], lng: parts[1] };
}

function structuredCost(raw: string | undefined) {
  const parsed = parseLegacyCost(raw);
  if (!parsed) return { costMin: null, costMax: null, costCurrency: null };
  return { costMin: parsed.min, costMax: parsed.max, costCurrency: parsed.currency };
}

async function linkSeedProgram(schoolId: string, raw: string | undefined, cache: Map<string, string>) {
  const label = raw?.trim() ?? "";
  if (!label) return;
  const key = label.toLowerCase();
  let itemId = cache.get(key);
  if (!itemId) {
    const [existing] = await db
      .select({ id: lookupItems.id })
      .from(lookupItems)
      .where(and(eq(lookupItems.kind, "program"), sql`lower(${lookupItems.label}) = ${key}`))
      .limit(1);
    if (existing) {
      itemId = existing.id;
    } else {
      const [created] = await db
        .insert(lookupItems)
        .values({ kind: "program", label })
        .returning({ id: lookupItems.id });
      itemId = created.id;
    }
    cache.set(key, itemId);
  }
  await db.insert(schoolLookupItems).values({ schoolId, itemId }).onConflictDoNothing();
}

function readDescription(fileSlug: string, fallback: string): string {
  const filePath = path.resolve(process.cwd(), "data", "descriptions", `${fileSlug}.txt`);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.error(`Failed to read description for ${fileSlug}:`, error);
  }
  return fallback;
}

export async function seedIfEmpty(): Promise<void> {
  const [{ value: schoolCount }] = await db.select({ value: count() }).from(schools);
  if (schoolCount > 0) {
    console.log(`[Seed] Skipping, ${schoolCount} schools already in database`);
    return;
  }

  const csvPath = path.resolve(process.cwd(), "data", "schools.csv");
  const csv = fs.readFileSync(csvPath, "utf-8");
  const parsed = parseSchoolsCsv(csv);
  const namesPath = path.resolve(process.cwd(), "data", "school-names.json");
  const namesByFileSlug = JSON.parse(fs.readFileSync(namesPath, "utf-8")) as Record<
    string,
    NameEntry
  >;

  const programIds = new Map<string, string>();

  for (const school of parsed) {
    const urlSlug = FILE_SLUG_TO_URL_SLUG[school.slug];
    if (!urlSlug) {
      throw new Error(`No URL slug mapping for file slug: ${school.slug}`);
    }

    const { lat, lng } = parseCoordinates(school.coordinates);
    const names = namesByFileSlug[school.slug] ?? {
      en: school.name,
      ru: school.name,
      ge: school.name,
      de: school.name,
    };
    const description = readDescription(school.slug, school.comment || "");

    const [inserted] = await db
      .insert(schools)
      .values({
        slug: urlSlug,
        address: school.address,
        lat,
        lng,
        languages: school.languages,
        ...structuredCost(school.cost),
        costStatus: school.cost ? "approximate" : "unknown",
        nameLocale: "en",
      })
      .returning({ id: schools.id });

    await linkSeedProgram(inserted.id, school.program, programIds);

    await db.insert(schoolTranslations).values(
      LOCALES.map((locale) => ({
        schoolId: inserted.id,
        locale,
        name: names[locale] || school.name,
        description,
      }))
    );
  }

  await db
    .insert(siteStats)
    .values({ key: "visits", value: 0 })
    .onConflictDoNothing();

  console.log(`[Seed] Inserted ${parsed.length} schools`);
}
