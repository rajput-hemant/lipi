import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionStatus = pgEnum("subscription_status", [
  "unpaid",
  "past_due",
  "incomplete_expired",
  "incomplete",
  "canceled",
  "active",
  "trialing",
]);

export const pricingType = pgEnum("pricing_type", ["recurring", "one_time"]);

export const pricingPlanInterval = pgEnum("pricing_plan_interval", [
  "year",
  "month",
  "week",
  "day",
]);
