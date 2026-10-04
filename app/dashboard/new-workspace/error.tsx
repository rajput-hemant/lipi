"use client";

import React from "react";
import Link from "next/link";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export default function NewWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("New workspace error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-6"
          />
        </div>

        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          Couldn&apos;t load workspace setup
        </h2>

        <p className="text-sm text-muted-foreground">
          There was an error preparing the new workspace form. Please try again.
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
