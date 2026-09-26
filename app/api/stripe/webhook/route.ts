import { NextResponse } from "next/server";

import type Stripe from "stripe";

import { hasProcessedStripeEvent } from "@/lib/db/queries/billing";
import { getStripeWebhookSecret } from "@/lib/stripe/billing-env";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhook-handlers";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    console.error("Stripe webhook verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (await hasProcessedStripeEvent(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
