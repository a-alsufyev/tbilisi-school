import { eq } from "drizzle-orm";
import { parseLegacyCost } from "../lib/cost";
import { db } from "./index";
import { schools } from "./schema";

export async function backfillStructuredCosts(): Promise<void> {
  const rows = await db
    .select({
      id: schools.id,
      cost: schools.cost,
      costMin: schools.costMin,
      costMax: schools.costMax,
    })
    .from(schools);

  for (const row of rows) {
    if (row.costMin != null || row.costMax != null) continue;
    const parsed = parseLegacyCost(row.cost);
    if (!parsed) continue;
    await db
      .update(schools)
      .set({
        costMin: parsed.min,
        costMax: parsed.max,
        costCurrency: parsed.currency,
        cost: null,
      })
      .where(eq(schools.id, row.id));
  }
}
