"use client";

import React from "react";
import { toast } from "sonner";

import type { Subscription } from "@/types/db";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type SubscriptionModalContext = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  subscription: Omit<Subscription, "prices"> | null;
};

const SubscriptionModalContext = React.createContext<SubscriptionModalContext>({
  open: false,
  setOpen: () => {},
  subscription: null,
});

export const useSubscriptionModal = () => {
  return React.useContext(SubscriptionModalContext);
};

type SubscriptionModalProviderProps = {
  subscription: Omit<Subscription, "prices"> | null;
  children: React.ReactNode;
};

export const SubscriptionModalProvider = ({
  subscription,
  children,
}: SubscriptionModalProviderProps) => {
  const [open, setOpen] = React.useState(false);

  function onClickHandler() {
    toast("This feature is not available yet.", {
      description: "Please try again later.",
    });
  }

  return (
    <SubscriptionModalContext.Provider value={{ open, setOpen, subscription }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        {subscription?.status === "active" ? (
          <DialogContent>Already on a paid plan!</DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              To access Pro features you need to have a paid plan.
            </DialogDescription>

            <DialogFooter>
              <Button size="sm" variant="secondary">
                Cancel
              </Button>
              <Button size="sm" onClick={onClickHandler}>
                Upgrade
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </SubscriptionModalContext.Provider>
  );
};
