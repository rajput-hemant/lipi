"use client";

import Link from "next/link";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { StripeCheckoutButton } from "@/components/billing/stripe-checkout-button";
import { Diamond } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING_CARDS, PRICING_PLANS } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  isAuthenticated: boolean;
};

export function PricingPlans({ isAuthenticated }: Props) {
  return (
    <div className="mx-auto flex flex-col gap-4 md:flex-row md:gap-10">
      {PRICING_CARDS.map(
        ({ planType, price, description, highlightFeature, features }) => {
          const isProPlan = planType === PRICING_PLANS.proplan;

          return (
            <Card
              key={planType}
              className={cn(
                "w-80 rounded-2xl py-6 transition-shadow ease-in-out hover:shadow-xl",
                isProPlan &&
                  "ring-4 ring-ring ring-offset-4 ring-offset-background hover:shadow-2xl"
              )}
            >
              <CardHeader>
                <CardTitle className="flex justify-between">
                  {planType}
                  {isProPlan && <Diamond size={32} />}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <span className="text-3xl font-semibold">
                  {formatCurrency(+price, "INR")}
                </span>

                {+price > 0 && (
                  <span className="ml-1 dark:text-muted-foreground">/mo</span>
                )}

                <p className="text-muted-foreground">{description}</p>

                {isProPlan ?
                  isAuthenticated ?
                    <StripeCheckoutButton
                      mode="checkout"
                      className="w-full whitespace-nowrap font-semibold"
                    >
                      Go Pro
                    </StripeCheckoutButton>
                  : <Button
                      render={<Link href="/login" />}
                      className="w-full whitespace-nowrap font-semibold"
                    >
                      Sign in to upgrade
                    </Button>

                : <Button
                    render={
                      <Link href={isAuthenticated ? "/dashboard" : "/signup"} />
                    }
                    variant="secondary"
                    className="w-full whitespace-nowrap font-semibold"
                  >
                    Get Started
                  </Button>
                }

                <div className="flex flex-col gap-2">
                  <small className="mb-4 text-center text-muted-foreground">
                    {highlightFeature}
                  </small>

                  <ul className="flex flex-col gap-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        }
      )}
    </div>
  );
}
