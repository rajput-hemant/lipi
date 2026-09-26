import type Stripe from "stripe";

import { prices, products } from "@/lib/db/schema";

type PriceRow = typeof prices.$inferInsert;
type ProductRow = typeof products.$inferInsert;

function productIdFromPrice(price: Stripe.Price): string | null {
  if (typeof price.product === "string") return price.product;
  return price.product?.id ?? null;
}

export function productRowFromStripe(product: Stripe.Product): ProductRow {
  return {
    id: product.id,
    active: product.active ?? null,
    name: product.name ?? null,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata ?? null,
  };
}

export function priceRowFromStripe(price: Stripe.Price): PriceRow | null {
  const productId = productIdFromPrice(price);
  if (!productId) return null;

  const recurring = price.recurring;
  let interval: PriceRow["interval"] = null;
  if (recurring?.interval === "year") interval = "year";
  else if (recurring?.interval === "month") interval = "month";
  else if (recurring?.interval === "week") interval = "week";
  else if (recurring?.interval === "day") interval = "day";

  return {
    id: price.id,
    productId,
    active: price.active ?? null,
    description: price.nickname ?? null,
    unitAmount: price.unit_amount ?? null,
    currency: price.currency ?? null,
    type: price.type === "recurring" ? "recurring" : "one_time",
    interval,
    intervalCount: recurring?.interval_count ?? null,
    trialPeriodDays: recurring?.trial_period_days ?? null,
    metadata: price.metadata ?? null,
  };
}

export function catalogRowsFromStripePrice(price: Stripe.Price): {
  product: ProductRow | null;
  price: PriceRow | null;
} {
  if (typeof price.product === "string") {
    return { product: null, price: priceRowFromStripe(price) };
  }

  if (
    price.product &&
    typeof price.product === "object" &&
    price.product.object === "product"
  ) {
    return {
      product: productRowFromStripe(price.product as Stripe.Product),
      price: priceRowFromStripe(price),
    };
  }

  return { product: null, price: priceRowFromStripe(price) };
}
