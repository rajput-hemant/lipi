"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  Edit2,
  FileIcon,
  FilePlus2,
  FileX,
  FolderIcon,
  Plus,
  Trash,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { File, Folder } from "@/types/db";

import { useAppState } from "@/hooks/use-app-state";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
} from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export function FoldersCollapsed() {
  const pathname = usePathname();
  const { setOpen, subscription } = useSubscriptionModal();

  const { files, addFile, removeFile, folders, addFolder, removeFolder } =
    useAppState();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
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
    <NavigationMenu orientation="vertical" className="max-w-none items-start">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger showIndicator={false} className="size-10 p-0">
            <Plus className="size-5" />
          </NavigationMenuTrigger>

          <NavigationMenuContent className="min-w-80 space-y-4 p-4">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              Create folder
            </h3>

            <form onSubmit={createFolderHandler} className="mt-4 space-y-4">
              <div className="flex gap-2">
                <EmojiPicker
                  title="Select an emoji"
                  getValue={setSelectedEmoji}
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  {!selectedEmoji ?
                    <FolderIcon className="size-5" />
                  : selectedEmoji}
                </EmojiPicker>

                <Input
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={createFolderToggle}
                >
                  Cancel
                </Button>

                <Button size="sm">Create</Button>
              </div>
            </form>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {folders.map(({ id, iconId, title }) => {
          const folderFiles = files.filter((f) => f.folderId === id);

          return (
            <NavigationMenuItem key={id!}>
              <NavigationMenuTrigger
                showIndicator={false}
                className="size-10 p-0"
              >
                {!iconId ?
                  <FolderIcon className="size-5" />
                : <span className="text-lg">{iconId}</span>}
              </NavigationMenuTrigger>

              <NavigationMenuContent className="min-h-60 min-w-80 space-y-4 p-4">
                <header className="flex items-center justify-between">
                  <h3 className="flex text-lg font-semibold leading-none tracking-tight">
                    {iconId ?
                      <span className="text-lg">{iconId}</span>
                    : <FolderIcon className="size-5" />}
                    <span className="ml-2">{title}</span>
                  </h3>

                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => createFileToggle(id!)}
                      className="size-7 p-0 text-muted-foreground"
                    >
                      <FilePlus2 className="size-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={currentlyInDev}
                      className="size-7 p-0 text-muted-foreground"
                    >
                      <Edit2 className="size-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => deleteFolderHandler(id!)}
                      className="size-7 p-0 text-muted-foreground"
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                </header>

                <ScrollArea>
                  <div className="max-h-[320px]">
                    {isCreatingFile && (
                      <form
                        onSubmit={(e) => createFileHandler(e, id!)}
                        className="relative mx-1 mb-1"
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
                      folderFiles.map(({ id, title, iconId, workspaceId }) => (
                        <div
                          key={id}
                          className={cn(
                            "group w-full justify-between",
                            buttonVariants({
                              size: "sm",
                              variant: "ghost",
                            })
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
                      ))
                    : <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-muted-foreground">
                        <FileX size={20} />

                        <p className="text-center text-sm">
                          You don&apos;t have any file yet.
                        </p>
                      </div>
                    }
                  </div>

                  <ScrollBar />
                </ScrollArea>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
