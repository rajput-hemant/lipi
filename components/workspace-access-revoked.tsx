import Link from "next/link";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export function WorkspaceAccessRevoked() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-6" />
        </div>

        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          You no longer have access to this workspace
        </h2>

        <p className="text-sm text-muted-foreground">
          You may have been removed by the workspace owner. Ask them to invite
          you again to regain access.
        </p>

        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Back to workspaces
        </Button>
      </div>
    </div>
  );
}
