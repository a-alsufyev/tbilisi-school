import path from "path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./index";

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
}

const invokedDirectly = /migrate\.(ts|js)$/i.test(process.argv[1] ?? "")
  || fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");

if (invokedDirectly) {
  runMigrations()
    .then(async () => {
      await sql.end({ timeout: 5 });
      console.log("[Migrate] Done");
    })
    .catch((error) => {
      console.error("[Migrate] Failed:", error);
      process.exit(1);
    });
}
