"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  React.useEffect(() => {
    console.error("Critical root error caught by global boundary:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else {
      reset();
    }
  };

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg
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

          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            A critical error occurred. Please try reloading the application.
          </p>

          {error.digest && (
            <p className="font-mono text-xs text-neutral-500">
              Digest: {error.digest}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={handleRetry}
              className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
