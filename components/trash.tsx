import React from "react";
import {
  Delete01Icon,
  File01Icon,
  GhostIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import type { Document } from "@/types/db";

import { useAppState } from "@/hooks/use-app-state";
import { deleteDocumentPermanently, restoreDocument } from "@/lib/db/queries";
import { Button } from "./ui/button";
import { DialogClose, DialogFooter } from "./ui/dialog";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function Trash() {
  const { documents, addDocument, updateDocument, deleteDocument } =
    useAppState();

  const trashed = documents.filter((document) => document.inTrash);

  async function restore(documentId: string) {
    const document = documents.find((entry) => entry.id === documentId);

    if (!document) {
      toast.error("Something went wrong", { description: "Page not found." });
      return;
    }

    const updated: Document = { ...document, inTrash: false };
    updateDocument(updated);

    toast.promise(restoreDocument(documentId), {
      loading: "Restoring page...",
      success: "Page restored",
      error: "Failed to restore page",
    });
  }

  async function deletePermanently(documentId: string) {
    const document = documents.find((entry) => entry.id === documentId);
    deleteDocument(documentId);

    toast.promise(deleteDocumentPermanently(documentId), {
      loading: "Deleting page...",
      success: "Page deleted permanently.",
      error: () => {
        if (document) addDocument(document);
        return "Something went wrong! Unable to delete page.";
      },
    });
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="px-4 text-sm font-medium text-muted-foreground">Trash</p>

      {trashed.length ?
        <ScrollArea className="h-64 px-4">
          <ul className="space-y-1">
            {trashed.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2 truncate text-sm">
                  {document.icon ?
                    document.icon
                  : <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4" />
                  }
                  {document.title}
                </span>

                <div className="flex shrink-0 gap-1">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => restore(document.id!)}
                        >
                          <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} className="size-4" />
                        </Button>
                      }
                    />
                    <TooltipContent>Restore</TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={0}>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive"
                          onClick={() => deletePermanently(document.id!)}
                        >
                          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                        </Button>
                      }
                    />
                    <TooltipContent>Delete permanently</TooltipContent>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
          <ScrollBar />
        </ScrollArea>
      : <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
          <HugeiconsIcon icon={GhostIcon} strokeWidth={2} size={28} />
          <p className="text-center text-sm">Trash is empty.</p>
        </div>
      }

      <DialogFooter className="px-4">
        <DialogClose render={<Button variant="outline">Close</Button>} />
      </DialogFooter>
    </div>
  );
}
