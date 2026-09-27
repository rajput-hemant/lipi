import Link from "next/link";
import { ArrowLeft02Icon, Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <span className="font-heading text-7xl font-bold tracking-tight text-muted-foreground/40 sm:text-9xl">
          404
        </span>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Page not found
        </h1>

        <p className="text-sm text-muted-foreground sm:text-base">
          The page you are looking for doesn&apos;t exist, has been removed, or
          is temporarily unavailable.
        </p>

        <div className="flex items-center gap-3 pt-4">
          <Button
            variant="outline"
            render={<Link href="/" className="gap-2" />}
          >
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              className="size-4"
            />
            Back to Home
          </Button>

          <Button render={<Link href="/dashboard" className="gap-2" />}>
            <HugeiconsIcon
              icon={Home01Icon}
              strokeWidth={2}
              className="size-4"
            />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
