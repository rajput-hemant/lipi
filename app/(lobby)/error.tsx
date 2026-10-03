"use client";

import React from "react";
import Link from "next/link";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export default function LobbyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Lobby error caught:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-7"
          />
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Unable to display page
        </h1>

        <p className="text-sm text-muted-foreground">
          We encountered an issue loading this section. Please try again.
        </p>

        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/80">
            Error digest: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={reset} className="gap-2">
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className="size-4"
            />
            Try again
          </Button>

          <Button variant="outline" render={<Link href="/" />}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
