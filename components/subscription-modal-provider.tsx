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
};

const SubscriptionModalContext = React.createContext<SubscriptionModalContext>({
  open: false,
  setOpen: () => {},
  subscription: null,
});

export const useSubscriptionModal = () => {
  return React.useContext(SubscriptionModalContext);
};

type Props = React.PropsWithChildren<{
  subscription: Subscription | null;
  hasErrored?: boolean;
}>;

export const SubscriptionModalProvider = (props: Props) => {
  const { subscription, hasErrored, children } = props;

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hasErrored) {
      toast.error("An unexpected error occurred", {
        description:
          "Unable to fetch your subscription status. Please try again later.",
      });
    }
  }, [hasErrored]);

  return (
    <SubscriptionModalContext.Provider value={{ open, setOpen, subscription }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        {subscription?.status === "active" ||
        subscription?.status === "trialing" ?
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pro plan active</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Manage payment method, invoices, or cancel in the Stripe billing
              portal.
            </DialogDescription>
            <DialogFooter>
              <DialogClose
                render={
                  <Button size="sm" variant="secondary">
                    Close
                  </Button>
                }
              />
              <StripeCheckoutButton mode="portal" variant="default">
                Manage billing
              </StripeCheckoutButton>
            </DialogFooter>
          </DialogContent>
        : <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              To access Pro features you need to have a paid plan.
            </DialogDescription>

            <DialogFooter>
              <DialogClose
                render={
                  <Button size="sm" variant="secondary">
                    Cancel
                  </Button>
                }
              />

              <StripeCheckoutButton mode="checkout" variant="default">
                Upgrade
              </StripeCheckoutButton>
            </DialogFooter>
          </DialogContent>
        }
      </Dialog>
    </SubscriptionModalContext.Provider>
  );
};
