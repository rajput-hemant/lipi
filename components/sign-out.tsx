"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import type { ButtonProps } from "./ui/button";

import { Button } from "./ui/button";

export function SignOut(props: ButtonProps) {
  async function signOutHandler() {
    toast.promise(signOut, {
      loading: "Signing out...",
      success: "You have been signed out.",
      error: "Something went wrong.",
    });
  }

  return (
    <Button title="Sign out" onClick={signOutHandler} {...props}>
      <LogOut className="size-4" />
    </Button>
  );
}
