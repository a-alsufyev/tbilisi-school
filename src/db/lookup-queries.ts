import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import {
  emptyLookupIds,
  emptyLookupLabels,
  isLookupKind,
  type LookupKind,
} from "../lib/lookups";
import { db } from "./index";
import { lookupItems, schoolLookupItems } from "./schema";

export type LookupItemRecord = {
  id: string;
  kind: LookupKind;
  label: string;
  schoolCount: number;
};

export type LookupLink = {
  schoolId: string;
  itemId: string;
  kind: LookupKind;
  label: string;
};

export class InvalidLookupSelection extends Error {
  constructor() {
    super("invalid_lookup");
    this.name = "InvalidLookupSelection";
  }
}

type LookupWriter = Pick<typeof db, "select" | "insert" | "delete" | "update">;

function isUniqueViolation(error: unknown): boolean {
  const candidates = [error];
  if (error && typeof error === "object" && "cause" in error) {
    candidates.push((error as { cause?: unknown }).cause);
  }
  return candidates.some((item) => {
    if (!item || typeof item !== "object" || !("code" in item)) return false;
    return String((item as { code: unknown }).code) === "23505";
  });
}

export async function listLookupLinks(): Promise<LookupLink[]> {
  const rows = await db
    .select({
      schoolId: schoolLookupItems.schoolId,
      itemId: lookupItems.id,
      kind: lookupItems.kind,
      label: lookupItems.label,
    })
    .from(schoolLookupItems)
    .innerJoin(lookupItems, eq(schoolLookupItems.itemId, lookupItems.id));

  return rows.flatMap((row) =>
    isLookupKind(row.kind) ? [{ schoolId: row.schoolId, itemId: row.itemId, kind: row.kind, label: row.label }] : []
  );
}

export function lookupIdsForSchool(links: LookupLink[], schoolId: string): Record<LookupKind, string[]> {
  const grouped = emptyLookupIds();
  for (const link of links) {
    if (link.schoolId === schoolId) grouped[link.kind].push(link.itemId);
  }
  return grouped;
}

export function lookupLabelsForSchool(links: LookupLink[], schoolId: string): Record<LookupKind, string[]> {
  const grouped = emptyLookupLabels();
  for (const link of links) {
    if (link.schoolId === schoolId) grouped[link.kind].push(link.label);
  }
  for (const kind of Object.keys(grouped) as LookupKind[]) {
    grouped[kind].sort((left, right) => left.localeCompare(right, "ru"));
  }
  return grouped;
}

export type PublicDirectoryItem = { label: string };
export type PublicDirectory = Record<LookupKind, PublicDirectoryItem[]>;

export async function listPublicDirectory(): Promise<PublicDirectory> {
  const grouped: PublicDirectory = {
    program: [],
    international_status: [],
    accreditation: [],
  };
  for (const item of await listLookupItems()) {
    if (item.schoolCount > 0) grouped[item.kind].push({ label: item.label });
  }
  return grouped;
}

export async function listLookupItems(): Promise<LookupItemRecord[]> {
  const items = await db.select().from(lookupItems).orderBy(asc(lookupItems.kind), asc(lookupItems.label));
  const counts = await db
    .select({ itemId: schoolLookupItems.itemId, value: count() })
    .from(schoolLookupItems)
    .groupBy(schoolLookupItems.itemId);
  const byItem = new Map(counts.map((row) => [row.itemId, Number(row.value)]));

  return items.flatMap((item) =>
    isLookupKind(item.kind)
      ? [{ id: item.id, kind: item.kind, label: item.label, schoolCount: byItem.get(item.id) ?? 0 }]
      : []
  );
}

async function findByLabel(kind: LookupKind, label: string, exceptId?: string) {
  const [row] = await db
    .select({ id: lookupItems.id })
    .from(lookupItems)
    .where(and(eq(lookupItems.kind, kind), sql`lower(${lookupItems.label}) = lower(${label})`))
    .limit(1);
  if (!row || row.id === exceptId) return null;
  return row;
}

export async function createLookupItem(
  kind: LookupKind,
  label: string
): Promise<LookupItemRecord | "duplicate"> {
  if (await findByLabel(kind, label)) return "duplicate";
  try {
    const [row] = await db.insert(lookupItems).values({ kind, label }).returning();
    return { id: row.id, kind, label: row.label, schoolCount: 0 };
  } catch (error) {
    if (isUniqueViolation(error)) return "duplicate";
    throw error;
  }
}

export async function updateLookupItem(
  id: string,
  label: string
): Promise<LookupItemRecord | "duplicate" | "not_found"> {
  const [current] = await db.select().from(lookupItems).where(eq(lookupItems.id, id)).limit(1);
  if (!current || !isLookupKind(current.kind)) return "not_found";
  if (await findByLabel(current.kind, label, id)) return "duplicate";
  try {
    const [row] = await db
      .update(lookupItems)
      .set({ label, updatedAt: new Date() })
      .where(eq(lookupItems.id, id))
      .returning();
    if (!row || !isLookupKind(row.kind)) return "not_found";
    const [{ value }] = await db
      .select({ value: count() })
      .from(schoolLookupItems)
      .where(eq(schoolLookupItems.itemId, id));
    return { id: row.id, kind: row.kind, label: row.label, schoolCount: Number(value) };
  } catch (error) {
    if (isUniqueViolation(error)) return "duplicate";
    throw error;
  }
}

export async function deleteLookupItem(id: string): Promise<"ok" | "in_use" | "not_found"> {
  const [current] = await db.select({ id: lookupItems.id }).from(lookupItems).where(eq(lookupItems.id, id)).limit(1);
  if (!current) return "not_found";
  const [{ value }] = await db
    .select({ value: count() })
    .from(schoolLookupItems)
    .where(eq(schoolLookupItems.itemId, id));
  if (Number(value) > 0) return "in_use";
  const deleted = await db.delete(lookupItems).where(eq(lookupItems.id, id)).returning({ id: lookupItems.id });
  return deleted.length > 0 ? "ok" : "not_found";
}

export async function replaceSchoolLookups(
  tx: LookupWriter,
  schoolId: string,
  idsByKind: Record<LookupKind, string[]>
): Promise<void> {
  const wanted = (Object.keys(idsByKind) as LookupKind[]).flatMap((kind) =>
    idsByKind[kind].map((itemId) => ({ itemId, kind }))
  );
  if (wanted.length > 0) {
    const rows = await tx
      .select({ id: lookupItems.id, kind: lookupItems.kind })
      .from(lookupItems)
      .where(
        inArray(
          lookupItems.id,
          wanted.map((item) => item.itemId)
        )
      );
    const byId = new Map(rows.map((row) => [row.id, row.kind]));
    for (const item of wanted) {
      if (byId.get(item.itemId) !== item.kind) throw new InvalidLookupSelection();
    }
  }

  await tx.delete(schoolLookupItems).where(eq(schoolLookupItems.schoolId, schoolId));
  if (wanted.length > 0) {
    await tx.insert(schoolLookupItems).values(wanted.map((item) => ({ schoolId, itemId: item.itemId })));
  }
}
