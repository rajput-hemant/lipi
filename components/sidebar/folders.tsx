"use client";

import React, { useOptimistic, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronDown,
  Edit2,
  File,
  FolderIcon,
  FolderOpen,
  FolderX,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { Folder } from "@/types/db";
import { createFolder, deleteFolder } from "@/lib/db/queries";
import { cn, isAppleDevice } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Kbd } from "../ui/kbd";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type FoldersProps = {
  folders: Folder[];
};

export function Folders({ folders }: FoldersProps) {
  const pathname = usePathname();
  const { setOpen, subscription } = useSubscriptionModal();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);
  const [folderName, setFolderName] = useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  const [optimisticFolders, setOptimisticFolders] = useOptimistic(folders);

  function createFolderToggle() {
    if (subscription?.status !== "active" && folders.length >= 3) {
      toast.error("Something went wrong", {
        description: "You have reached the maximum number of folders.",
      });

      setOpen(true);
      return;
    }

    setIsCreatingFolder((prev) => !prev);
  }

  async function createFolderHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (folderName.length < 3) {
      toast.warning("Folder name must be at least 3 characters long.");
      return;
    }

    const newFolder: Folder = {
      id: uuid(),
      title: folderName,
      iconId: selectedEmoji,
      workspaceId: pathname.split("/")[2],
    };

    setOptimisticFolders((state) => [...state, newFolder]);

    toast.promise(createFolder(newFolder), {
      loading: "Creating folder...",
      success: "Folder created.",
      error: "Something went wrong! Unable to create folder.",
    });

    setSelectedEmoji("");
    setFolderName("Untitled");
    setIsCreatingFolder(false);
  }

  function currentlyInDev() {
    toast.info("This feature is currently in development.", {
      description: "We're working on it and it'll be available soon.",
    });
  }

  async function deleteFolderHandler(folderId: string) {
    // TODO: ui not updating as expected
    setOptimisticFolders((state) => state.filter((f) => f.id !== folderId));

    toast.promise(deleteFolder(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted.",
      error: "Something went wrong! Unable to delete folder.",
    });
  }

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <p className="text-sm font-medium text-muted-foreground">Folders</p>
        <Button
          title={isCreatingFolder ? "Cancel" : "Create New folder"}
          size="icon"
          variant="ghost"
          onClick={createFolderToggle}
          className="h-7 w-7 text-muted-foreground"
        >
          {isCreatingFolder ?
            <X className="h-4 w-4 duration-300 animate-in spin-in-90" />
          : <Plus className="h-[18px] w-[18px] duration-300 animate-out spin-out-90" />
          }
        </Button>
      </div>

      <div className="-mb-2 flex grow flex-col gap-1 overflow-hidden">
        {isCreatingFolder || folders.length ?
          <ScrollArea>
            <Accordion
              type="multiple"
              value={openedFolders}
              onValueChange={setOpenedFolders}
              className="px-4 py-1"
            >
              {isCreatingFolder && (
                <form onSubmit={createFolderHandler} className="relative mb-1">
                  <EmojiPicker
                    title="Select an emoji"
                    getValue={setSelectedEmoji}
                    className="absolute inset-y-0 left-3"
                  >
                    {!selectedEmoji ?
                      <FolderIcon className="h-4 w-4" />
                    : selectedEmoji}
                  </EmojiPicker>

                  <Input
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={cn(
                      "h-9 px-9",
                      folderName.length < 3 && "!ring-destructive"
                    )}
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute inset-y-0 right-1 my-auto h-7 w-7 text-muted-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </form>
              )}

              {optimisticFolders.map(({ id, title, iconId }) => (
                <AccordionItem
                  key={id}
                  value={id!}
                  className="my-px border-none"
                >
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <AccordionTrigger
                        showIndicator={false}
                        className={cn(
                          buttonVariants({ size: "sm", variant: "ghost" }),
                          "justify-start border-none hover:no-underline data-[state=open]:bg-secondary"
                        )}
                      >
                        <span className="mr-2">
                          {!iconId ?
                            openedFolders.includes(id!) ?
                              <FolderOpen className="h-4 w-4 shrink-0" />
                            : <FolderIcon className="h-4 w-4 shrink-0" />
                          : iconId}
                        </span>

                        {title}

                        <ChevronDown className="invisible ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-hover/trigger:visible group-data-[state=open]/trigger:visible group-data-[state=open]/trigger:rotate-180" />
                      </AccordionTrigger>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-48">
                      <ContextMenuItem
                        onClick={currentlyInDev}
                        className="cursor-pointer"
                      >
                        <File className="mr-2 h-4 w-4 shrink-0" />
                        New File
                        <Kbd className="ml-auto">
                          {isAppleDevice() ? "⌘" : "Ctrl"} N
                        </Kbd>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onClick={currentlyInDev}
                        className="cursor-pointer"
                      >
                        <Edit2 className="mr-2 h-4 w-4 shrink-0" />
                        Rename
                        <Kbd className="ml-auto">
                          {isAppleDevice() ? "⌘" : "Ctrl"} E
                        </Kbd>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onKeyDown={(e) => {
                          e.preventDefault();

                          if (e.ctrlKey && e.key.toLowerCase() === "d") {
                            deleteFolderHandler(id!);
                          }
                        }}
                        onClick={() => deleteFolderHandler(id!)}
                        className="cursor-pointer !text-red-500"
                      >
                        <Trash className="mr-2 h-4 w-4 shrink-0" />
                        Delete
                        <Kbd className="ml-auto">
                          {isAppleDevice() ? "⌘" : "Ctrl"} D
                        </Kbd>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  <AccordionContent className="pb-2 pl-2 pt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Link
                        key={i}
                        href="/dashboard"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "ghost" }),
                          "w-full justify-start"
                        )}
                      >
                        <File className="mr-2 h-4 w-4 shrink-0" />
                        File {i + 1}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <ScrollBar />
          </ScrollArea>
        : <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-muted-foreground">
            <FolderX size={32} />
            <p className="text-center text-sm">
              You don&apos;t have any folders yet.
            </p>
          </div>
        }
      </div>
    </>
  );
}
