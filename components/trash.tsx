"use client";

import React, { useState } from "react";
import {
  Delete01Icon,
  File01Icon,
  GhostIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import type { DocumentSummary } from "@/types/db";

import { toAllDocumentRecords } from "@/components/sidebar/document-tree-utils";
import {
  useAppState,
  useCanEditPages,
  usePageAccess,
} from "@/hooks/use-app-state";
import {
  patchDocumentsForRestore,
  permanentDeleteTargetIds,
} from "@/lib/db/client-document-state";
import {
  isMutationDenied,
  mutationErrorMessage,
  unwrapMutation,
} from "@/lib/db/mutation-result";
import { deleteDocumentPermanently, restoreDocument } from "@/lib/db/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { DialogClose, DialogFooter } from "./ui/dialog";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function cloneDocuments(
  documents: readonly DocumentSummary[]
): DocumentSummary[] {
  return documents.map((document) => ({ ...document }));
}

export function Trash() {
  const { documents, replaceDocuments } = useAppState();
  const canEdit = useCanEditPages();
  const isViewer = usePageAccess() === "view";
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const trashed = documents.filter((document) => document.inTrash);
  const pendingDocument = trashed.find(
    (document) => document.id === pendingDeleteId
  );

  async function restore(documentId: string) {
    const records = toAllDocumentRecords(documents);
    const previous = cloneDocuments(documents);
    const next = patchDocumentsForRestore(previous, records, documentId);

    replaceDocuments(next);

    toast.promise(unwrapMutation(restoreDocument(documentId)), {
      loading: "Restoring page...",
      success: "Page restored",
      error: (error) => {
        replaceDocuments(previous);
        return isMutationDenied(error) ?
            "You do not have permission to restore pages."
          : mutationErrorMessage(error, "Failed to restore page");
      },
    });
  }

  async function confirmPermanentDelete() {
    if (!pendingDeleteId) return;
    const documentId = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      const records = toAllDocumentRecords(documents);
      const deleteIds = new Set(permanentDeleteTargetIds(records, documentId));
      const previous = cloneDocuments(documents);
      replaceDocuments(
        previous.filter((document) => !deleteIds.has(document.id))
      );

      toast.promise(unwrapMutation(deleteDocumentPermanently(documentId)), {
        loading: "Deleting page...",
        success: "Page deleted permanently.",
        error: (error) => {
          replaceDocuments(previous);
          return isMutationDenied(error) ?
              "You do not have permission to delete pages."
            : mutationErrorMessage(
                error,
                "Something went wrong! Unable to delete page."
              );
        },
      });
    } catch {
      toast.error("Something went wrong", {
        description: "This page cannot be deleted permanently.",
      });
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="px-4 text-sm font-medium text-muted-foreground">Trash</p>
      {isViewer && trashed.length > 0 && (
        <p className="px-4 text-xs text-muted-foreground">
          You have view-only access. Ask an editor or the owner to restore or
          delete pages.
        </p>
      )}

      {trashed.length ?
        <ScrollArea className="h-[min(24rem,50vh)] px-4">
          <ul className="space-y-1">
            {trashed.map((document) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
              >
                <span
                  className="flex min-w-0 items-center gap-2 text-sm"
                  title={document.title}
                >
                  {document.icon ?
                    document.icon
                  : <HugeiconsIcon
                      icon={File01Icon}
                      strokeWidth={2}
                      className="size-4 shrink-0"
                    />
                  }
                  <span className="truncate">{document.title}</span>
                </span>

                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            aria-label={`Restore ${document.title}`}
                            onClick={() => restore(document.id)}
                          >
                            <HugeiconsIcon
                              icon={Undo02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>Restore</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive"
                            aria-label={`Delete ${document.title} permanently`}
                            onClick={() => setPendingDeleteId(document.id)}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>Delete permanently</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <ScrollBar />
        </ScrollArea>
      : <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HugeiconsIcon
              icon={GhostIcon}
              strokeWidth={2}
              size={24}
              aria-hidden="true"
            />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nothing in the trash</p>
            <p className="text-sm text-muted-foreground">
              {canEdit ?
                "Pages you delete will appear here."
              : "Pages deleted by editors will appear here."}
            </p>
          </div>
        </div>
      }

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. &quot;
              <span className="break-words">{pendingDocument?.title}</span>
              &quot; will be removed forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogFooter className="px-4">
        <DialogClose render={<Button variant="outline">Close</Button>} />
      </DialogFooter>
    </div>
  );
}
