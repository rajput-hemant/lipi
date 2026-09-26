import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { BillingNotConfiguredError } from "@/lib/billing/errors";
import { createBillingPortalSessionForUser } from "@/lib/stripe/checkout";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createBillingPortalSessionForUser(user.id);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof BillingNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      error.message.includes("No Stripe customer")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
