export const LOOKUP_KINDS = ["program", "international_status", "accreditation"] as const;
export type LookupKind = (typeof LOOKUP_KINDS)[number];

export const LOOKUP_LABEL_MAX = 120;

export function isLookupKind(value: string): value is LookupKind {
  return (LOOKUP_KINDS as readonly string[]).includes(value);
}

export function normalizeLookupLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.trim();
  if (!label || label.length > LOOKUP_LABEL_MAX) return null;
  return label;
}

export function joinLookupLabels(labels: readonly string[] | undefined): string {
  return (labels ?? [])
    .map((label) => label.trim())
    .filter(Boolean)
    .join(", ");
}

const UNCONFIRMED_INTERNATIONAL_STATUSES = new Set([
  "international status not verified",
  "no confirmed international status",
]);

/** Catalog notes meaning "no status" or "not checked"; they are not something a school can be proud of. */
export function isUnconfirmedInternationalStatus(label: string): boolean {
  return UNCONFIRMED_INTERNATIONAL_STATUSES.has(label.trim().toLowerCase());
}

/** International statuses worth showing as a highlight (drops the "none / not verified" notes). */
export function confirmedInternationalStatuses(labels: readonly string[] | undefined): string[] {
  return (labels ?? []).filter((label) => !isUnconfirmedInternationalStatus(label));
}

export function emptyLookupIds(): Record<LookupKind, string[]> {
  return { program: [], international_status: [], accreditation: [] };
}

export function emptyLookupLabels(): Record<LookupKind, string[]> {
  return { program: [], international_status: [], accreditation: [] };
}
