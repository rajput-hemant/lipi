"use client";

import React from "react";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Critical root error caught by global boundary:", error);
  }, [error]);

  // The app's theme is class-based (next-themes); this boundary sits outside
  // the provider, so mirror the stored or OS preference here.
  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 font-sans text-foreground antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <svg
              aria-hidden="true"
              className="size-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Application Error
          </h1>

          <p className="text-sm text-muted-foreground">
            A critical error occurred. Please try reloading the application.
          </p>

          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Digest: {error.digest}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={reset}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
