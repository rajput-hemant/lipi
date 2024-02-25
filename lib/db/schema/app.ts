import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "../table-creator";
import { users } from "./auth";
import { pricingPlanInterval, pricingType, subscriptionStatus } from "./enums";

export const workspaces = createTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  title: text("title").notNull(),
  iconId: text("icon_id").notNull(),
  data: text("data"),
  logo: text("logo"),
  bannerUrl: text("banner_url"),
  workspaceOwnerId: uuid("workspace_owner_id").notNull(),
  inTrash: boolean("in_trash").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
});

export const folders = createTable("folders", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  title: text("title").notNull(),
  iconId: text("icon_id").notNull(),
  data: text("data"),
  bannerUrl: text("banner_url"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "cascade",
  }),
  inTrash: boolean("in_trash").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
});

export const files = createTable("files", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  title: text("title").notNull(),
  iconId: text("icon_id").notNull(),
  data: text("data"),
  bannerUrl: text("banner_url"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "cascade",
  }),
  folderId: uuid("folder_id").references(() => folders.id, {
    onDelete: "cascade",
  }),
  inTrash: boolean("in_trash").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
});

export const accounts = createTable("accounts", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  billingAddress: jsonb("billing_address"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  paymentMethod: jsonb("payment_method"),
});

export const customers = createTable("customers", {
  id: uuid("id").primaryKey().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
});

export const prices = createTable("prices", {
  id: text("id").primaryKey().notNull(),
  productId: text("product_id").references(() => products.id),
  active: boolean("active"),
  description: text("description"),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  unitAmount: bigint("unit_amount", { mode: "number" }),
  currency: text("currency"),
  type: pricingType("type"),
  interval: pricingPlanInterval("interval"),
  intervalCount: integer("interval_count"),
  trialPeriodDays: integer("trial_period_days"),
  metadata: jsonb("metadata"),
});

export const products = createTable("products", {
  id: text("id").primaryKey().notNull(),
  active: boolean("active"),
  name: text("name"),
  description: text("description"),
  image: text("image"),
  metadata: jsonb("metadata"),
});

export const subscriptions = createTable("subscriptions", {
  id: text("id").primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  status: subscriptionStatus("status"),
  metadata: jsonb("metadata"),
  priceId: text("price_id").references(() => prices.id),
  quantity: integer("quantity"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end"),
  created: timestamp("created", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  cancelAt: timestamp("cancel_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  canceledAt: timestamp("canceled_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  trialStart: timestamp("trial_start", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  trialEnd: timestamp("trial_end", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const collaborators = createTable("collaborators", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));
