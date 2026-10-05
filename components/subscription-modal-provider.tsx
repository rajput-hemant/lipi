"use client";

import React from "react";
import { toast } from "sonner";

import type { Subscription } from "@/types/db";

import { StripeCheckoutButton } from "@/components/billing/stripe-checkout-button";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type SubscriptionModalContext = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  subscription: Subscription | null;
  hasProEntitlement: boolean;
  hasErrored: boolean;
};

const SubscriptionModalContext = React.createContext<SubscriptionModalContext>({
  open: false,
  setOpen: () => {},
  subscription: null,
  hasProEntitlement: false,
  hasErrored: false,
});

export const useSubscriptionModal = () => {
  return React.useContext(SubscriptionModalContext);
};

const proPlanDialog = {
  title: "Pro plan active",
  description:
    "Manage payment method, invoices, or cancel in the Stripe billing portal.",
  dismiss: "Close",
  mode: "portal",
  action: "Manage billing",
} as const;

const upgradeDialog = {
  title: "Upgrade to a Pro Plan",
  description: "To access Pro features you need to have a paid plan.",
  dismiss: "Cancel",
  mode: "checkout",
  action: "Upgrade",
} as const;

type Props = React.PropsWithChildren<{
  subscription: Subscription | null;
  hasProEntitlement: boolean;
  hasErrored?: boolean;
}>;

export const SubscriptionModalProvider = (props: Props) => {
  const { subscription, hasProEntitlement, hasErrored, children } = props;

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hasErrored) {
      toast.error("An unexpected error occurred", {
        description:
          "Unable to fetch your subscription status. Please try again later.",
      });
    }
  }, [hasErrored]);

  const plan = hasProEntitlement ? proPlanDialog : upgradeDialog;

  return (
    <SubscriptionModalContext.Provider
      value={{
        open,
        setOpen,
        subscription,
        hasProEntitlement,
        hasErrored: !!hasErrored,
      }}
    >
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{plan.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{plan.description}</DialogDescription>
          <DialogFooter>
            <DialogClose
              render={
                <Button size="sm" variant="secondary">
                  {plan.dismiss}
                </Button>
              }
            />
            <StripeCheckoutButton mode={plan.mode} variant="default">
              {plan.action}
            </StripeCheckoutButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SubscriptionModalContext.Provider>
  );
};
