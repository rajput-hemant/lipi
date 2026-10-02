"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Copy01Icon,
  Delete01Icon,
  Delete02Icon,
  File01Icon,
  FileNotFoundIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { DocumentTreeNode } from "./document-tree-utils";
import type { Document } from "@/types/db";

import { useNotifyWorkspacePageChanges } from "@/components/realtime/workspace-realtime-provider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAppState } from "@/hooks/use-app-state";
import { buildOptimisticDuplicateDocuments } from "@/lib/db/client-document-state";
import {
  flattenVisibleTreeNodes,
  resolveTreeKeyAction,
} from "@/lib/db/document-tree-navigation";
import { collectDescendantIds } from "@/lib/db/documents-tree";
import {
  createDocument,
  duplicateDocument,
  softDeleteDocumentTree,
  updateDocumentInDb,
} from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  countChildren,
  getDocumentForest,
  toDocumentRecords,
} from "./document-tree-utils";

type DocumentTreeItemProps = {
  node: DocumentTreeNode;
  depth: number;
  workspaceId: string;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  expandNode: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
};

function DocumentTreeItem({
  node,
  depth,
  workspaceId,
  expandedIds,
  toggleExpanded,
  expandNode,
  focusedId,
  setFocusedId,
}: DocumentTreeItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const {
    addDocument,
    deleteDocument,
    updateDocument: updateDocumentState,
    documents: allDocuments,
  } = useAppState();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const [creatingChild, setCreatingChild] = useState(false);
  const [childTitle, setChildTitle] = useState("Untitled");
  const [childIcon, setChildIcon] = useState("");

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = pathname.endsWith(`/${node.id}`);

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const title = renameValue.trim();
    if (title.length < 1) {
      toast.warning("Title is required.");
      return;
    }

    setIsRenaming(false);

    toast.promise(updateDocumentInDb({ id: node.id, title }), {
      loading: "Renaming...",
      success: (updated) => {
        updateDocumentState(updated);
        notifyPageChanges();
        return "Page renamed.";
      },
      error: "Could not rename page.",
    });
  }

  async function createChildPage(e: React.FormEvent) {
    e.preventDefault();
    const title = childTitle.trim();
    if (title.length < 1) {
      toast.warning("Title is required.");
      return;
    }

    const newDocument: Document = {
      id: uuid(),
      workspaceId,
      parentId: node.id,
      title,
      icon: childIcon,
      bannerUrl: null,
      content: null,
      inTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocument(newDocument);
    expandNode(node.id);
    setCreatingChild(false);
    setChildTitle("Untitled");
    setChildIcon("");

    toast.promise(createDocument(newDocument), {
      loading: "Creating page...",
      success: () => {
        notifyPageChanges();
        return "Page created.";
      },
      error: "Could not create page.",
    });
  }

  async function duplicatePage() {
    const newId = uuid();
    const records = toDocumentRecords(allDocuments);
    const copies = buildOptimisticDuplicateDocuments(
      allDocuments as Document[],
      records,
      node.id,
      newId,
      uuid,
      workspaceId
    );

    for (const copy of copies) {
      addDocument(copy);
    }

    toast.promise(duplicateDocument({ sourceId: node.id, newId }), {
      loading: "Duplicating...",
      success: () => {
        notifyPageChanges();
        return "Page duplicated.";
      },
      error: () => {
        for (const copy of copies) {
          deleteDocument(copy.id);
        }
        return "Could not duplicate page.";
      },
    });
  }

  async function moveToTrash() {
    const records = toDocumentRecords(allDocuments);
    const trashIds = new Set([
      node.id,
      ...collectDescendantIds(records, node.id),
    ]);

    for (const document of allDocuments) {
      const documentId = document.id;
      if (!documentId || !trashIds.has(documentId)) continue;
      updateDocumentState({ ...document, inTrash: true });
    }

    const openDocumentId = pathname.split("/")[3];
    if (openDocumentId && trashIds.has(openDocumentId)) {
      router.push(`/dashboard/${workspaceId}`);
    }

    toast.promise(softDeleteDocumentTree(node.id), {
      loading: "Moving to trash...",
      success: () => {
        notifyPageChanges();
        return "Moved to trash.";
      },
      error: "Could not move to trash.",
    });
  }

  return (
    <li
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      className="list-none"
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-0.5 rounded-md pr-1",
              buttonVariants({ size: "sm", variant: "ghost" }),
              isActive && "bg-secondary"
            )}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
          >
            {hasChildren ?
              <button
                type="button"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                onClick={() => toggleExpanded(node.id)}
              >
                <HugeiconsIcon
                  icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </button>
            : <span className="inline-block size-6 shrink-0" />}

            {isRenaming ?
              <form
                onSubmit={submitRename}
                className="flex min-w-0 flex-1 gap-1"
              >
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setRenameValue(node.title);
                      setIsRenaming(false);
                    }
                  }}
                  className="h-8"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </Button>
              </form>
            : <>
                <Link
                  prefetch={false}
                  id={`document-tree-item-${node.id}`}
                  href={`/dashboard/${workspaceId}/${node.id}`}
                  tabIndex={focusedId === node.id ? 0 : -1}
                  onFocus={() => setFocusedId(node.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 truncate"
                >
                  <span className="shrink-0">
                    {node.icon ?
                      node.icon
                    : <HugeiconsIcon
                        icon={File01Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    }
                  </span>
                  <span className="truncate">{node.title}</span>
                </Link>
              </>
            }
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52">
          <ContextMenuItem
            className="cursor-pointer"
            onClick={() => setCreatingChild(true)}
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
            New subpage
          </ContextMenuItem>
          <ContextMenuItem
            className="cursor-pointer"
            onClick={() => {
              setRenameValue(node.title);
              setIsRenaming(true);
            }}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem className="cursor-pointer" onClick={duplicatePage}>
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
            Duplicate
          </ContextMenuItem>
          <ContextMenuItem
            className="cursor-pointer !text-red-500"
            onClick={moveToTrash}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
            Move to trash
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {creatingChild && (
        <form
          onSubmit={createChildPage}
          className="relative my-1 mr-2"
          style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
        >
          <EmojiPicker
            title="Select an emoji"
            side="right"
            align="start"
            getValue={setChildIcon}
            className="absolute inset-y-0 left-0 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
          >
            {childIcon || (
              <HugeiconsIcon
                icon={File01Icon}
                strokeWidth={2}
                className="size-4"
              />
            )}
          </EmojiPicker>
          <Input
            autoFocus
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setCreatingChild(false);
                setChildTitle("Untitled");
                setChildIcon("");
              }
            }}
            className="h-9 pl-9"
          />
        </form>
      )}

      {hasChildren && isExpanded && (
        <ul role="group" className="m-0 p-0">
          {node.children.map((child) => (
            <DocumentTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              workspaceId={workspaceId}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              expandNode={expandNode}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DocumentTree() {
  const pathname = usePathname();
  const workspaceId = pathname.split("/")[2] ?? "";
  const { setOpen, hasProEntitlement } = useSubscriptionModal();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const { documents, addDocument } = useAppState();

  const forest = useMemo(() => getDocumentForest(documents), [documents]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [rootTitle, setRootTitle] = useState("Untitled");
  const [rootIcon, setRootIcon] = useState("");

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandNode = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  const collapseNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const visibleNodes = useMemo(
    () => flattenVisibleTreeNodes(forest, expandedIds),
    [forest, expandedIds]
  );

  const activeFocusId = focusedId ?? visibleNodes[0]?.id ?? null;

  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const navigationKeys = [
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (!navigationKeys.includes(event.key)) return;

    event.preventDefault();
    const action = resolveTreeKeyAction(
      event.key,
      activeFocusId,
      visibleNodes,
      expandedIds
    );

    if (action.expandId) expandNode(action.expandId);
    if (action.collapseId) collapseNode(action.collapseId);
    if (action.nextFocusId) {
      setFocusedId(action.nextFocusId);
      requestAnimationFrame(() => {
        document
          .getElementById(`document-tree-item-${action.nextFocusId}`)
          ?.focus();
      });
    }
  };

  function createRootToggle() {
    const rootCount = countChildren(documents, null);
    if (!hasProEntitlement && rootCount >= 3) {
      toast.error("Something went wrong", {
        description: "You have reached the maximum number of root pages.",
      });
      setOpen(true);
      return;
    }
    setIsCreatingRoot((prev) => !prev);
  }

  async function createRootPage(e: React.FormEvent) {
    e.preventDefault();
    const title = rootTitle.trim();
    if (title.length < 1) {
      toast.warning("Title is required.");
      return;
    }

    const newDocument: Document = {
      id: uuid(),
      workspaceId,
      parentId: null,
      title,
      icon: rootIcon,
      bannerUrl: null,
      content: null,
      inTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocument(newDocument);
    setIsCreatingRoot(false);
    setRootTitle("Untitled");
    setRootIcon("");

    toast.promise(createDocument(newDocument), {
      loading: "Creating page...",
      success: () => {
        notifyPageChanges();
        return "Page created.";
      },
      error: "Could not create page.",
    });
  }

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <p className="text-sm font-medium text-muted-foreground">Pages</p>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                onClick={createRootToggle}
                className="size-7 text-muted-foreground"
                aria-label={isCreatingRoot ? "Cancel new page" : "New page"}
              >
                {isCreatingRoot ?
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                : <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="size-[18px]"
                  />
                }
              </Button>
            }
          />
          <TooltipContent>
            {isCreatingRoot ? "Cancel" : "New page"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="-mb-2 flex grow flex-col gap-1 overflow-hidden">
        {isCreatingRoot || forest.length ?
          <ScrollArea>
            <ul
              role="tree"
              aria-label="Workspace pages"
              className="m-0 px-2 py-1"
              onKeyDown={onTreeKeyDown}
            >
              {isCreatingRoot && (
                <li className="list-none px-2">
                  <form onSubmit={createRootPage} className="relative mb-1">
                    <EmojiPicker
                      title="Select an emoji"
                      side="right"
                      align="start"
                      getValue={setRootIcon}
                      className="absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                    >
                      {rootIcon || (
                        <HugeiconsIcon
                          icon={File01Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
                      )}
                    </EmojiPicker>
                    <Input
                      autoFocus
                      value={rootTitle}
                      onChange={(e) => setRootTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setIsCreatingRoot(false);
                          setRootTitle("Untitled");
                          setRootIcon("");
                        }
                      }}
                      className="h-9 px-9"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="absolute inset-y-0 right-1 my-auto size-7"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </form>
                </li>
              )}

              {forest.map((node) => (
                <DocumentTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  workspaceId={workspaceId}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  expandNode={expandNode}
                  focusedId={activeFocusId}
                  setFocusedId={setFocusedId}
                />
              ))}
            </ul>
            <ScrollBar />
          </ScrollArea>
        : <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-muted-foreground">
            <HugeiconsIcon icon={FileNotFoundIcon} strokeWidth={2} size={32} />
            <p className="text-center text-sm">
              No pages yet. Create your first page.
            </p>
          </div>
        }
      </div>
    </>
  );
}
