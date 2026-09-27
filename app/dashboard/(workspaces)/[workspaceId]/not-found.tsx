import Link from "next/link";
import { File01Icon, Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export default function DocumentNotFound() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-7" />
        </div>

        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Document not found
        </h2>

        <p className="text-sm text-muted-foreground">
          This page does not exist or may have been moved to the trash. Select
          another document from the sidebar to continue.
        </p>

        <div className="pt-2">
          <Button
            variant="outline"
            render={<Link href="/dashboard" className="gap-2" />}
          >
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
