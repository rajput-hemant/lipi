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
  Trash2,
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
  deleteFileFromDb,
  deleteFolderFromDb,
  updateFileInDb,
  updateFolderInDb,
} from "@/lib/db/queries";
import { cn, currentlyInDev, isAppleDevice } from "@/lib/utils";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Kbd } from "../ui/kbd";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function Folders() {
  const pathname = usePathname();
  const { setOpen, subscription } = useSubscriptionModal();

  const {
    files: stateFiles,
    folders: stateFolders,
    addFile,
    deleteFile,
    updateFile,
    addFolder,
    deleteFolder,
    updateFolder,
  } = useAppState();

  const files = stateFiles.filter((file) => !file.inTrash);
  const folders = stateFolders.filter((folder) => !folder.inTrash);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [creatingFiles, setCreatingFiles] = useState<string[]>([]);
  const [openedFolders, setOpenedFolders] = useState<string[]>([]);
  const [folderName, setFolderName] = useState("Untitled");
  const [fileName, setFileName] = useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  function createFolderToggle() {
    if (subscription?.status !== "active" && stateFolders.length >= 3) {
      const description =
        stateFolders.length === folders.length ?
          "You have reached the maximum number of folders."
        : "You have reached the maximum number of folders. Try clearing the trash to create more folders.";

      toast.error("Something went wrong", { description });

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

    setCreatingFiles((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId);
      }

      return [...prev, folderId];
    });
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

    setCreatingFiles((prev) => prev.filter((id) => id !== folderId));
  }

  async function moveFileToTrash(fileId: string) {
    const file = files.find((f) => f.id === fileId);

    if (!file) {
      toast.error("Something went wrong", { description: "File not found." });
      return;
    }

    const updatedFile: File = { ...file, inTrash: true };
    updateFile(updatedFile);

    toast.promise(updateFileInDb(updatedFile), {
      loading: "Moving file to trash...",
      success: "File moved to trash.",
      error: "Something went wrong! Unable to move file to trash.",
    });
  }

  async function moveFolderToTrash(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);

    if (!folder) {
      toast.error("Something went wrong", { description: "Folder not found." });
      return;
    }

    const updatedFolder: Folder = { ...folder, inTrash: true };
    updateFolder(updatedFolder);
    toast.promise(updateFolderInDb({ ...folder, inTrash: true }), {
      loading: "Moving folder to trash...",
      success: "Folder moved to trash.",
      error: "Something went wrong! Unable to move folder to trash.",
    });
  }

  async function deleteFileHandler(fileId: string) {
    deleteFile(fileId);

    toast.promise(deleteFileFromDb(fileId), {
      loading: "Deleting file...",
      success: "File deleted.",
      error: "Something went wrong! Unable to delete file.",
    });
  }

  async function deleteFolderHandler(folderId: string) {
    deleteFolder(folderId);

    toast.promise(deleteFolderFromDb(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted.",
      error: "Something went wrong! Unable to delete folder.",
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

                      <ContextMenuContent className="w-56">
                        <ContextMenuItem
                          onClick={() => createFileToggle(id!)}
                          className="cursor-pointer"
                        >
                          <FileIcon className="mr-2 size-4 shrink-0" />
                          New File
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"}+N
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={currentlyInDev}
                          className="cursor-pointer"
                        >
                          <Edit2 className="mr-2 size-4 shrink-0" />
                          Rename
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"}+E
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onKeyDown={(e) => {
                            e.preventDefault();

                            if (e.ctrlKey && e.key.toLowerCase() === "d") {
                              moveFolderToTrash(id!);
                            }
                          }}
                          onClick={() => moveFolderToTrash(id!)}
                          className="cursor-pointer !text-red-500"
                        >
                          <Trash2 className="mr-2 size-4 shrink-0" />
                          Move to Trash
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"}+D
                          </Kbd>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onKeyDown={(e) => {
                            e.preventDefault();

                            if (
                              e.ctrlKey &&
                              e.shiftKey &&
                              e.key.toLowerCase() === "d"
                            ) {
                              deleteFolderHandler(id!);
                            }
                          }}
                          onClick={() => deleteFolderHandler(id!)}
                          className="cursor-pointer !text-red-500"
                        >
                          <Trash className="mr-2 size-4 shrink-0" />
                          Delete
                          <Kbd className="ml-auto">
                            {isAppleDevice() ? "⌘" : "Ctrl"}+Shift+D
                          </Kbd>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>

                    <AccordionContent className="pb-2 pl-2 pt-1">
                      {creatingFiles.includes(id!) && (
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

                      {creatingFiles.includes(id!) || folderFiles.length ?
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

                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    onClick={currentlyInDev}
                                    className="size-7 p-0 text-muted-foreground"
                                  >
                                    <Edit2 className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit file</TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <AlertDialogTrigger>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="size-7 p-0 text-muted-foreground hover:text-red-500"
                                      >
                                        <Trash className="size-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete file</TooltipContent>
                                  </Tooltip>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the file.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => moveFileToTrash(id!)}
                                      className="bg-destructive/10 text-destructive hover:bg-destructive/15"
                                    >
                                      Move to trash
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() => deleteFileHandler(id!)}
                                      className={buttonVariants({
                                        variant: "destructive",
                                      })}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
