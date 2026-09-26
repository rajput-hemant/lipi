"use client";

import { useRouter } from "next/navigation";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { signOut } from "@/lib/auth/auth-client";
import { Button } from "./ui/button";

export function SignOut(props: React.ComponentProps<typeof Button>) {
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
      <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
    </Button>
  );
}
