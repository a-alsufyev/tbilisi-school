import { sql } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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
  costMin: doublePrecision("cost_min"),
  costMax: doublePrecision("cost_max"),
  costCurrency: text("cost_currency"),
  costStatus: text("cost_status").notNull().default("approximate"),
  costYear: integer("cost_year"),
  costPeriod: text("cost_period"),
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

export const lookupItems = pgTable(
  "lookup_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("lookup_items_kind_label_lower").on(table.kind, sql`lower(${table.label})`)]
);

export const schoolLookupItems = pgTable(
  "school_lookup_items",
  {
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => lookupItems.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.schoolId, table.itemId] })]
);
