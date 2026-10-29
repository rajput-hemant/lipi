"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useCreateRootPage } from "@/components/sidebar/use-create-root-page";
import { Button } from "@/components/ui/button";

export function NewPageButton({ workspaceId }: { workspaceId: string }) {
  const createRootPage = useCreateRootPage(workspaceId);

  return (
    <Button className="mt-4" onClick={() => createRootPage("Untitled")}>
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      New page
    </Button>
  );
}
