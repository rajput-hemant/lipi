import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { BillingNotConfiguredError } from "@/lib/billing/errors";
import { createCheckoutSessionForUser } from "@/lib/stripe/checkout";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await createCheckoutSessionForUser({
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof BillingNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
