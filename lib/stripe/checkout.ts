import { resolveAuthBaseURL } from "@/lib/auth/resolve-auth-base-url";
import {
  getCustomerByUserId,
  upsertStripeCustomer,
} from "@/lib/db/queries/billing";
import { getStripeProPriceId } from "./billing-env";
import { getStripe } from "./client";

export async function createCheckoutSessionForUser(params: {
  userId: string;
  email: string;
}) {
  const stripe = getStripe();
  const priceId = getStripeProPriceId();
  const baseUrl = resolveAuthBaseURL();

  const existing = await getCustomerByUserId(params.userId);
  let stripeCustomerId = existing?.stripeCustomerId ?? undefined;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: params.email,
      metadata: { userId: params.userId },
    });
    stripeCustomerId = customer.id;
    await upsertStripeCustomer(params.userId, stripeCustomerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: params.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=canceled`,
    subscription_data: {
      metadata: { userId: params.userId },
    },
    metadata: { userId: params.userId },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing redirect url");
  }

  return session.url;
}

export async function createBillingPortalSessionForUser(userId: string) {
  const stripe = getStripe();
  const baseUrl = resolveAuthBaseURL();
  const existing = await getCustomerByUserId(userId);

  if (!existing?.stripeCustomerId) {
    throw new Error("No Stripe customer for user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripeCustomerId,
    return_url: `${baseUrl}/dashboard`,
  });

  return session.url;
}
