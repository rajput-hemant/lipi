"use client";

import React from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  openStripeBillingPortal,
  startStripeCheckout,
} from "@/lib/billing/checkout-client";

type Props = {
  mode: "checkout" | "portal";
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function StripeCheckoutButton({
  mode,
  children,
  className,
  variant = "default",
}: Props) {
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    setLoading(true);
    try {
      if (mode === "checkout") {
        await startStripeCheckout();
      } else {
        await openStripeBillingPortal();
      }
    } catch (error) {
      toast.error("Billing unavailable", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={loading}
      aria-busy={loading}
      onClick={onClick}
    >
      {loading && (
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="animate-spin"
        />
      )}
      {children}
    </Button>
  );
}
