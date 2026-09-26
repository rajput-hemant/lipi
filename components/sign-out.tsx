"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ButtonProps } from "./ui/button";

import { Button } from "./ui/button";
import { signOut } from "@/lib/auth/auth-client";

export function SignOut(props: ButtonProps) {
  const router = useRouter();

  async function signOutHandler() {
    try {
      await signOut();
      toast.success("You have been signed out.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <Button title="Sign out" onClick={signOutHandler} {...props}>
      <LogOut className="size-4" />
    </Button>
  );
}
