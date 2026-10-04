import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  address: text("address").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  languages: text("languages").notNull(),
  website: text("website"),
  cost: text("cost"),
  costStatus: text("cost_status").notNull().default("approximate"),
  program: text("program"),
  nameLocale: text("name_locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schoolTranslations = pgTable(
  "school_translations",
  {
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.schoolId, table.locale] })]
);

export const siteStats = pgTable("site_stats", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});
