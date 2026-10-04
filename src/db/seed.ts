import fs from "fs";
import path from "path";
import { count } from "drizzle-orm";
import { db } from "./index";
import { schools, schoolTranslations, siteStats } from "./schema";
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
        cost: school.cost || null,
        costStatus: school.cost ? "approximate" : "unknown",
        program: school.program || null,
        nameLocale: "en",
      })
      .returning({ id: schools.id });

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
