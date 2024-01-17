"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronDown,
  Edit2,
  FileIcon,
  FileX,
  FolderIcon,
  FolderOpen,
  FolderX,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { File, Folder } from "@/types/db";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAppState } from "@/hooks/use-app-state";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
} from "@/lib/db/queries";
import { cn, isAppleDevice } from "@/lib/utils";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function Folders() {
  const pathname = usePathname();
  const { setOpen, subscription } = useSubscriptionModal();

  const { files, addFile, removeFile, folders, addFolder, removeFolder } =
    useAppState();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);
  const [folderName, setFolderName] = useState("Untitled");
  const [fileName, setFileName] = useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = useState("");

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

  function createFileToggle(folderId: string) {
    if (
      subscription?.status !== "active" &&
      files.filter((f) => f.folderId === folderId).length >= 3
    ) {
      toast.error("Something went wrong", {
        description: "You have reached the maximum number of files.",
      });

      setOpen(true);
      return;
    }

    setIsCreatingFile(true);
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

    addFolder(newFolder);

    toast.promise(createFolder(newFolder), {
      loading: "Creating folder...",
      success: "Folder created.",
      error: "Something went wrong! Unable to create folder.",
    });

    setSelectedEmoji("");
    setFolderName("Untitled");
    setIsCreatingFolder(false);
  }

  async function createFileHandler(
    e: React.FormEvent<HTMLFormElement>,
    folderId: string
  ) {
    e.preventDefault();

    if (fileName.length < 3) {
      toast.warning("File name must be at least 3 characters long.");
      return;
    }

    const newFile: File = {
      id: uuid(),
      title: fileName,
      iconId: selectedEmoji,
      folderId,
      workspaceId: pathname.split("/")[2],
    };

    addFile(newFile);

    toast.promise(createFile(newFile), {
      loading: "Creating file...",
      success: "File created.",
      error: "Something went wrong! Unable to create file.",
    });

    setSelectedEmoji("");
    setFileName("Untitled");
    setIsCreatingFile(false);
  }

  function currentlyInDev() {
    toast.info("This feature is currently in development.", {
      description: "We're working on it and it'll be available soon.",
    });
  }

  async function deleteFolderHandler(folderId: string) {
    removeFolder(folderId);

    toast.promise(deleteFolder(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted.",
      error: "Something went wrong! Unable to delete folder.",
    });
  }

  async function deleteFileHandler(fileId: string) {
    removeFile(fileId);

    toast.promise(deleteFile(fileId), {
      loading: "Deleting file...",
      success: "File deleted.",
      error: "Something went wrong! Unable to delete file.",
    });
  }

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <p className="text-sm font-medium text-muted-foreground">Folders</p>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={createFolderToggle}
              className="size-7 text-muted-foreground"
            >
              {isCreatingFolder ?
                <X className="size-4 duration-300 animate-in spin-in-90" />
              : <Plus className="size-[18px] duration-300 animate-out spin-out-90" />
              }
            </Button>
          </TooltipTrigger>

          <TooltipContent>
            {isCreatingFolder ? "Cancel" : "Create New folder"}
          </TooltipContent>
        </Tooltip>
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
                    side="right"
                    align="start"
                    getValue={setSelectedEmoji}
                    className="absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                  >
                    {!selectedEmoji ?
                      <FolderIcon className="size-4" />
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
                    className="absolute inset-y-0 right-1 my-auto size-7 text-muted-foreground"
                  >
                    <Check className="size-4" />
                  </Button>
                </form>
              )}

              {folders.map(({ id, title, iconId }) => {
                const folderFiles = files.filter((f) => f.folderId === id);

                return (
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
                            {iconId ?
                              iconId
                            : openedFolders.includes(id!) ?
                              <FolderOpen className="size-4 shrink-0" />
                            : <FolderIcon className="size-4 shrink-0" />}
                          </span>

                          {title}

                          <ChevronDown className="invisible ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/trigger:visible group-data-[state=open]/trigger:visible group-data-[state=open]/trigger:rotate-180" />
                        </AccordionTrigger>
                      </ContextMenuTrigger>

                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={() => createFileToggle(id!)}
                          className="cursor-pointer"
                        >
                          <FileIcon className="mr-2 size-4 shrink-0" />
                          New File
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"} N
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={currentlyInDev}
                          className="cursor-pointer"
                        >
                          <Edit2 className="mr-2 size-4 shrink-0" />
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
                          <Trash className="mr-2 size-4 shrink-0" />
                          Delete
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"} D
                          </Kbd>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>

                    <AccordionContent className="pb-2 pl-2 pt-1">
                      {isCreatingFile && (
                        <form
                          onSubmit={(e) => createFileHandler(e, id!)}
                          className="relative mb-1 mr-1"
                        >
                          <EmojiPicker
                            title="Select an emoji"
                            side="right"
                            align="start"
                            getValue={setSelectedEmoji}
                            className="absolute inset-y-0 left-1 my-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                          >
                            {!selectedEmoji ?
                              <FileIcon className="size-4" />
                            : selectedEmoji}
                          </EmojiPicker>

                          <Input
                            autoFocus
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className={cn(
                              "my-1 h-9 px-9",
                              fileName.length < 3 && "!ring-destructive"
                            )}
                          />

                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute inset-y-0 right-1 my-auto size-7 text-muted-foreground"
                          >
                            <Check className="size-4" />
                          </Button>
                        </form>
                      )}

                      {isCreatingFile || folderFiles.length ?
                        folderFiles.map(
                          ({ id, title, iconId, workspaceId }) => (
                            <div
                              key={id}
                              className={cn(
                                "group w-full justify-between",
                                buttonVariants({ size: "sm", variant: "ghost" })
                              )}
                            >
                              <Link
                                href={`/dashboard/${workspaceId}/${id}`}
                                className="flex w-full items-center gap-0.5"
                              >
                                <span className="mr-2 shrink-0">
                                  {iconId ?
                                    iconId
                                  : <FileIcon className="size-4" />}
                                </span>
                                {title}
                              </Link>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={currentlyInDev}
                                className="invisible z-10 ml-auto size-7 shrink-0 text-muted-foreground group-hover:visible"
                              >
                                <Edit2 className="size-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteFileHandler(id!)}
                                className="invisible z-10 size-7 shrink-0 text-muted-foreground hover:text-red-500 group-hover:visible"
                              >
                                <Trash className="size-4" />
                              </Button>
                            </div>
                          )
                        )
                      : <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-muted-foreground">
                          <FileX size={20} />

                          <p className="text-center text-sm">
                            You don&apos;t have any file yet.
                          </p>
                        </div>
                      }
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
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
