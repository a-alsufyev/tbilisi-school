CREATE TABLE "lookup_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lookup_items_kind_check" CHECK ("kind" IN ('program', 'authorization', 'accreditation'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "lookup_items_kind_label_lower" ON "lookup_items" ("kind", lower("label"));
--> statement-breakpoint
CREATE TABLE "school_lookup_items" (
	"school_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	CONSTRAINT "school_lookup_items_school_id_item_id_pk" PRIMARY KEY("school_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "school_lookup_items" ADD CONSTRAINT "school_lookup_items_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "school_lookup_items" ADD CONSTRAINT "school_lookup_items_item_id_lookup_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."lookup_items"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
WITH counted AS (
	SELECT btrim("program") AS label, count(*) AS n
	FROM "schools"
	WHERE "program" IS NOT NULL AND btrim("program") <> ''
	GROUP BY btrim("program")
),
ranked AS (
	SELECT label,
		row_number() OVER (PARTITION BY lower(label) ORDER BY n DESC, label ASC) AS rn
	FROM counted
)
INSERT INTO "lookup_items" ("kind", "label")
SELECT 'program', label
FROM ranked
WHERE rn = 1;
--> statement-breakpoint
INSERT INTO "school_lookup_items" ("school_id", "item_id")
SELECT s."id", i."id"
FROM "schools" s
INNER JOIN "lookup_items" i
	ON i."kind" = 'program' AND lower(i."label") = lower(btrim(s."program"))
WHERE s."program" IS NOT NULL AND btrim(s."program") <> '';
--> statement-breakpoint
ALTER TABLE "schools" DROP COLUMN "program";
