import { runMigrations } from "./migrate";
import { seedIfEmpty } from "./seed";

export async function prepareDatabase(): Promise<void> {
  console.log("[DB] Running migrations...");
  await runMigrations();
  console.log("[DB] Seeding if empty...");
  await seedIfEmpty();
}
