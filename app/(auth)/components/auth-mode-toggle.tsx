"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function AuthModeLink({ search }: { search?: URLSearchParams }) {
  const isLoginPage = usePathname() === "/login";

  return (
    <Link
      href={{
        pathname: isLoginPage ? "/signup" : "/login",
        query: search ? Object.fromEntries(search) : undefined,
      }}
      className={cn(
        buttonVariants({ size: "sm", variant: "outline" }),
        "absolute right-4 top-4 w-20 transition-all duration-200 hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-background md:right-8 md:top-8"
      )}
    >
      {isLoginPage ? "Sign Up" : "Login"}
    </Link>
  );
}

function AuthModeLinkWithQuery() {
  // Keeps `from` so an invitee who switches to sign-up still returns to the invite.
  return <AuthModeLink search={useSearchParams()} />;
}

// useSearchParams needs a Suspense boundary; the fallback keeps the button in the static shell.
export function AuthModeToggle() {
  return (
    <Suspense fallback={<AuthModeLink />}>
      <AuthModeLinkWithQuery />
    </Suspense>
  );
}
