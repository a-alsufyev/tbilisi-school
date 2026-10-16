ALTER TABLE "lookup_items" DROP CONSTRAINT "lookup_items_kind_check";
--> statement-breakpoint
UPDATE "lookup_items" SET "kind" = 'international_status' WHERE "kind" = 'authorization';
--> statement-breakpoint
ALTER TABLE "lookup_items" ADD CONSTRAINT "lookup_items_kind_check" CHECK ("kind" IN ('program', 'international_status', 'accreditation'));
