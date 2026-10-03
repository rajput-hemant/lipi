"use client";

import React from "react";

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

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans text-neutral-900 antialiased [@media(prefers-color-scheme:dark)]:bg-neutral-950 [@media(prefers-color-scheme:dark)]:text-neutral-100">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 [@media(prefers-color-scheme:dark)]:bg-red-950/50 [@media(prefers-color-scheme:dark)]:text-red-400">
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

          <p className="text-sm text-neutral-600 [@media(prefers-color-scheme:dark)]:text-neutral-400">
            A critical error occurred. Please try reloading the application.
          </p>

          {error.digest && (
            <p className="font-mono text-xs text-neutral-500">
              Digest: {error.digest}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={reset}
              className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 [@media(prefers-color-scheme:dark)]:bg-neutral-100 [@media(prefers-color-scheme:dark)]:text-neutral-900 [@media(prefers-color-scheme:dark)]:hover:bg-neutral-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
