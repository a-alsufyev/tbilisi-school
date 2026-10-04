import type { CostStatus, School } from "../types";

export const COST_STATUSES = ["official", "approximate", "unknown"] as const satisfies readonly CostStatus[];

export function isCostStatus(value: string): value is CostStatus {
  return (COST_STATUSES as readonly string[]).includes(value);
}

export function costStatusOf(school: { cost?: string | null; costStatus?: string | null }): CostStatus {
  if (school.costStatus && isCostStatus(school.costStatus)) return school.costStatus;
  return school.cost ? "approximate" : "unknown";
}

export function formatSchoolCost(school: Pick<School, "cost" | "costStatus">, labels: Record<CostStatus, string>): string {
  const status = costStatusOf(school);
  if (status === "unknown") return labels.unknown;
  return school.cost ? `${school.cost} (${labels[status]})` : labels[status];
}
