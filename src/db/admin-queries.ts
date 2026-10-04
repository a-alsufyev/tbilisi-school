import { asc, eq, ne, and } from "drizzle-orm";
import { suggestSlug } from "../admin/slug";
import { ADMIN_LOCALES, blankTranslations, type AdminSchool, type AdminSchoolInput } from "../admin/types";
import { isAdminLocale } from "../admin/validate";
import { isCostStatus } from "../lib/cost";
import { geocodeAddress } from "../lib/geocode";
import { isSafeSchoolIdentifier } from "../lib/schools";
import { db } from "./index";
import { schoolTranslations, schools } from "./schema";

type SchoolRow = typeof schools.$inferSelect;

function toAdminSchool(
  row: SchoolRow,
  translations: AdminSchool["translations"]
): AdminSchool {
  return {
    id: row.id,
    slug: row.slug,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    languages: row.languages,
    website: row.website,
    cost: row.cost,
    costStatus: isCostStatus(row.costStatus) ? row.costStatus : row.cost ? "approximate" : "unknown",
    program: row.program,
    nameLocale: isAdminLocale(row.nameLocale) ? row.nameLocale : "en",
    translations,
  };
}

function translationRows(schoolId: string, input: AdminSchoolInput) {
  return ADMIN_LOCALES.map((locale) => ({
    schoolId,
    locale,
    name: input.translations[locale].name,
    description: input.translations[locale].description,
  }));
}

export function isSlugConflict(error: unknown): boolean {
  const candidates = [error];
  if (error && typeof error === "object" && "cause" in error) {
    candidates.push((error as { cause?: unknown }).cause);
  }
  return candidates.some((item) => {
    if (!item || typeof item !== "object" || !("code" in item)) return false;
    return String((item as { code: unknown }).code) === "23505";
  });
}

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const where = exceptId
    ? and(eq(schools.slug, slug), ne(schools.id, exceptId))
    : eq(schools.slug, slug);
  const [row] = await db.select({ id: schools.id }).from(schools).where(where).limit(1);
  return !!row;
}

export async function ensureUniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = isSafeSchoolIdentifier(base) ? base : "school";
  let candidate = root;
  for (let n = 2; n < 100; n += 1) {
    if (!(await isSlugTaken(candidate, exceptId))) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function assignSlug(input: AdminSchoolInput, exceptId?: string): Promise<AdminSchoolInput> {
  if (input.slug) return input;
  const slug = await ensureUniqueSlug(
    suggestSlug([
      input.translations.en.name,
      input.translations.ru.name,
      input.translations.ge.name,
      input.translations.de.name,
    ]),
    exceptId
  );
  return { ...input, slug };
}

export async function listAdminSchools(): Promise<AdminSchool[]> {
  const rows = await db.select().from(schools).orderBy(asc(schools.slug));
  const translations = await db.select().from(schoolTranslations);
  const bySchool = new Map<string, AdminSchool["translations"]>();

  for (const row of translations) {
    const current = bySchool.get(row.schoolId) ?? blankTranslations();
    if (isAdminLocale(row.locale)) {
      current[row.locale] = { name: row.name, description: row.description };
    }
    bySchool.set(row.schoolId, current);
  }

  return rows.map((row) => toAdminSchool(row, bySchool.get(row.id) ?? blankTranslations()));
}

export async function createAdminSchool(
  input: AdminSchoolInput
): Promise<{ school: AdminSchool; geocodeWarning: boolean }> {
  const coords = await geocodeAddress(input.address);
  const school = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schools)
      .values({
        slug: input.slug,
        address: input.address,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        languages: input.languages,
        website: input.website,
        cost: input.cost,
        costStatus: input.costStatus,
        program: input.program,
        nameLocale: input.nameLocale,
      })
      .returning();

    await tx.insert(schoolTranslations).values(translationRows(row.id, input));
    return toAdminSchool(row, input.translations);
  });
  return { school, geocodeWarning: coords === null };
}

export async function updateAdminSchool(
  id: string,
  input: AdminSchoolInput
): Promise<{ school: AdminSchool; geocodeWarning: boolean } | null> {
  const [existing] = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  if (!existing) return null;

  const addressChanged = existing.address.trim() !== input.address.trim();
  let lat = existing.lat;
  let lng = existing.lng;
  let geocodeWarning = false;
  if (addressChanged) {
    const coords = await geocodeAddress(input.address);
    lat = coords?.lat ?? null;
    lng = coords?.lng ?? null;
    geocodeWarning = coords === null;
  }

  const school = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(schools)
      .set({
        slug: input.slug,
        address: input.address,
        lat,
        lng,
        languages: input.languages,
        website: input.website,
        cost: input.cost,
        costStatus: input.costStatus,
        program: input.program,
        nameLocale: input.nameLocale,
        updatedAt: new Date(),
      })
      .where(eq(schools.id, id))
      .returning();

    if (!row) return null;

    await tx.delete(schoolTranslations).where(eq(schoolTranslations.schoolId, row.id));
    await tx.insert(schoolTranslations).values(translationRows(row.id, input));

    return toAdminSchool(row, input.translations);
  });

  if (!school) return null;
  return { school, geocodeWarning };
}
