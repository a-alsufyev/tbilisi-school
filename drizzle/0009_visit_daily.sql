CREATE TABLE "visit_daily" (
	"day" date NOT NULL,
	"country" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visit_daily_day_country_pk" PRIMARY KEY("day","country")
);
