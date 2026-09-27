"use client";

import React from "react";
import Link from "next/link";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  React.useEffect(() => {
    // Log unexpected runtime errors
    console.error("Runtime error caught by root boundary:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else {
      reset();
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-7"
          />
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>

        <p className="text-sm text-muted-foreground sm:text-base">
          An unexpected error occurred while loading this page. You can try
          reloading or return home.
        </p>

        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/80">
            Error digest: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleRetry} className="gap-2">
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className="size-4"
            />
            Try again
          </Button>

          <Button variant="outline" render={<Link href="/" />}>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
