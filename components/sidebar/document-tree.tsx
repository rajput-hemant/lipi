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
import type { DocumentSummary } from "@/types/db";

import { useNotifyWorkspacePageChanges } from "@/components/realtime/workspace-realtime-provider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useAppState,
  useCanEditPages,
  usePageAccess,
} from "@/hooks/use-app-state";
import {
  createDocument,
  duplicateDocument,
  softDeleteDocumentTree,
  updateDocument,
} from "@/lib/db/actions/document";
import { buildOptimisticDuplicateDocuments } from "@/lib/db/client-document-state";
import {
  flattenVisibleTreeNodes,
  resolveTreeKeyAction,
} from "@/lib/db/document-tree-navigation";
import { collectDescendantIds } from "@/lib/db/documents-tree";
import { isMutationDenied, unwrapMutation } from "@/lib/db/mutation-result";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../ui/sidebar";
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
  const canEdit = useCanEditPages();
  const { setOpenMobile } = useSidebar();

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

    toast.promise(updateDocument({ id: node.id, title }), {
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

    const newDocument: DocumentSummary = {
      id: uuid(),
      workspaceId,
      parentId: node.id,
      title,
      icon: childIcon,
      bannerUrl: null,
      inTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocument(newDocument);
    expandNode(node.id);
    setCreatingChild(false);
    setChildTitle("Untitled");
    setChildIcon("");

    toast.promise(unwrapMutation(createDocument(newDocument)), {
      loading: "Creating page...",
      success: () => {
        notifyPageChanges();
        return "Page created.";
      },
      error: (error) => {
        deleteDocument(newDocument.id);
        return isMutationDenied(error) ?
            "You do not have permission to create pages."
          : "Could not create page.";
      },
    });
  }

  async function duplicatePage() {
    const newId = uuid();
    const records = toDocumentRecords(allDocuments);
    const copies = buildOptimisticDuplicateDocuments(
      allDocuments as DocumentSummary[],
      records,
      node.id,
      newId,
      uuid,
      workspaceId
    );

    for (const copy of copies) {
      addDocument(copy);
    }

    toast.promise(
      unwrapMutation(duplicateDocument({ sourceId: node.id, newId })),
      {
        loading: "Duplicating...",
        success: () => {
          notifyPageChanges();
          return "Page duplicated.";
        },
        error: (error) => {
          for (const copy of copies) {
            deleteDocument(copy.id);
          }
          return isMutationDenied(error) ?
              "You do not have permission to duplicate this page."
            : "Could not duplicate page.";
        },
      }
    );
  }

  async function moveToTrash() {
    const records = toDocumentRecords(allDocuments);
    const trashIds = new Set([
      node.id,
      ...collectDescendantIds(records, node.id),
    ]);

    const previous = allDocuments.filter((document) =>
      trashIds.has(document.id)
    );

    for (const document of allDocuments) {
      const documentId = document.id;
      if (!documentId || !trashIds.has(documentId)) continue;
      updateDocumentState({ ...document, inTrash: true });
    }

    toast.promise(unwrapMutation(softDeleteDocumentTree(node.id)), {
      loading: "Moving to trash...",
      success: () => {
        const openDocumentId = pathname.split("/")[3];
        if (openDocumentId && trashIds.has(openDocumentId)) {
          router.push(`/dashboard/${workspaceId}`);
        }
        notifyPageChanges();
        return "Moved to trash.";
      },
      error: (error) => {
        for (const document of previous) {
          updateDocumentState({ ...document });
        }
        return isMutationDenied(error) ?
            "You do not have permission to move this page to trash."
          : "Could not move to trash.";
      },
    });
  }

  const isNested = depth > 0;
  const Item = isNested ? SidebarMenuSubItem : SidebarMenuItem;
  const link = (
    <Link
      prefetch={false}
      id={`document-tree-item-${node.id}`}
      href={`/dashboard/${workspaceId}/${node.id}`}
      tabIndex={focusedId === node.id ? 0 : -1}
      onFocus={() => setFocusedId(node.id)}
      onClick={() => setOpenMobile(false)}
    />
  );
  const label = (
    <>
      <span className="shrink-0">
        {node.icon ?
          node.icon
        : <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4" />
        }
      </span>
      <span>{node.title}</span>
    </>
  );

  const row = (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (isRenaming) return;
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          e.stopPropagation();
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          target.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            })
          );
        }
      }}
    >
      {isRenaming ?
        <form onSubmit={submitRename} className="flex min-w-0 gap-1">
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
            aria-label="Page title"
            className="h-8"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Save title"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
        </form>
      : <>
          {isNested ?
            <SidebarMenuSubButton
              isActive={isActive}
              render={link}
              className={cn(hasChildren && "pr-8")}
            >
              {label}
            </SidebarMenuSubButton>
          : <SidebarMenuButton isActive={isActive} render={link}>
              {label}
            </SidebarMenuButton>
          }
          {hasChildren && (
            <SidebarMenuAction
              aria-label={isExpanded ? "Collapse" : "Expand"}
              aria-expanded={isExpanded}
              className={cn(isNested && "top-1")}
              onClick={() => toggleExpanded(node.id)}
            >
              <HugeiconsIcon
                icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                strokeWidth={2}
              />
            </SidebarMenuAction>
          )}
        </>
      }
    </div>
  );

  return (
    <Item
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
    >
      {canEdit ?
        <ContextMenu>
          <ContextMenuTrigger>{row}</ContextMenuTrigger>

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
              variant="destructive"
              className="cursor-pointer"
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
      : row}

      {(creatingChild || (hasChildren && isExpanded)) && (
        <SidebarMenuSub role="group" className="ml-3 mr-0 pl-2 pr-0">
          {creatingChild && (
            <SidebarMenuSubItem>
              <form onSubmit={createChildPage} className="relative my-1">
                <EmojiPicker
                  title="Select an emoji"
                  side="right"
                  align="start"
                  getValue={setChildIcon}
                  className="absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
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
                  aria-label="New page title"
                  className="h-9 pl-9"
                />
              </form>
            </SidebarMenuSubItem>
          )}
          {isExpanded &&
            node.children.map((child) => (
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
        </SidebarMenuSub>
      )}
    </Item>
  );
}

export function DocumentTree() {
  const pathname = usePathname();
  const workspaceId = pathname.split("/")[2] ?? "";
  const { setOpen, hasProEntitlement } = useSubscriptionModal();
  const notifyPageChanges = useNotifyWorkspacePageChanges();
  const { documents, addDocument, deleteDocument } = useAppState();
  const access = usePageAccess();
  const canEdit = access === "edit";

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

    const newDocument: DocumentSummary = {
      id: uuid(),
      workspaceId,
      parentId: null,
      title,
      icon: rootIcon,
      bannerUrl: null,
      inTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocument(newDocument);
    setIsCreatingRoot(false);
    setRootTitle("Untitled");
    setRootIcon("");

    toast.promise(unwrapMutation(createDocument(newDocument)), {
      loading: "Creating page...",
      success: () => {
        notifyPageChanges();
        return "Page created.";
      },
      error: (error) => {
        deleteDocument(newDocument.id);
        return isMutationDenied(error) ?
            "You do not have permission to create pages."
          : "Could not create page.";
      },
    });
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Pages
        {!canEdit && access === "view" && (
          <Badge variant="secondary" className="ml-auto text-xs">
            View only
          </Badge>
        )}
      </SidebarGroupLabel>
      {canEdit && (
        <Tooltip>
          <TooltipTrigger
            render={
              <SidebarGroupAction
                onClick={createRootToggle}
                aria-label={isCreatingRoot ? "Cancel new page" : "New page"}
              />
            }
          >
            <HugeiconsIcon
              icon={isCreatingRoot ? Cancel01Icon : PlusSignIcon}
              strokeWidth={2}
            />
          </TooltipTrigger>
          <TooltipContent>
            {isCreatingRoot ? "Cancel" : "New page"}
          </TooltipContent>
        </Tooltip>
      )}

      <SidebarGroupContent>
        {isCreatingRoot || forest.length ?
          <SidebarMenu
            role="tree"
            aria-label="Workspace pages"
            className="gap-0.5"
            onKeyDown={onTreeKeyDown}
          >
            {isCreatingRoot && (
              <SidebarMenuItem>
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
                    aria-label="New page title"
                    className="h-9 px-9"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute inset-y-0 right-1 my-auto size-7"
                    aria-label="Create page"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </Button>
                </form>
              </SidebarMenuItem>
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
          </SidebarMenu>
        : <div className="flex flex-col items-center justify-center gap-4 px-2 py-6 text-muted-foreground">
            <HugeiconsIcon icon={FileNotFoundIcon} strokeWidth={2} size={32} />
            <p className="text-center text-sm">
              {canEdit ?
                "No pages yet. Create your first page."
              : "No pages yet. Only editors and the owner can add pages."}
            </p>
          </div>
        }
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
