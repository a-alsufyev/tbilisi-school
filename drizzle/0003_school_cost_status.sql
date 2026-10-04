ALTER TABLE "schools" ADD COLUMN "cost_status" text DEFAULT 'approximate' NOT NULL;
UPDATE "schools" SET "cost_status" = 'unknown' WHERE "cost" IS NULL OR btrim("cost") = '';
