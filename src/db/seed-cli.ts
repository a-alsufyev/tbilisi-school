import { seedIfEmpty } from "./seed";
import { sql } from "./index";

seedIfEmpty()
  .then(async () => {
    await sql.end({ timeout: 5 });
  })
  .catch((error) => {
    console.error("[Seed] Failed:", error);
    process.exit(1);
  });
