"use client";

import React, { useOptimistic, useState } from "react";
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

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type FoldersCollapsedProps = {
  files: File[];
  folders: Folder[];
};

export function FoldersCollapsed({ files, folders }: FoldersCollapsedProps) {
  const pathname = usePathname();
  const { setOpen, subscription } = useSubscriptionModal();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [folderName, setFolderName] = useState("Untitled");
  const [fileName, setFileName] = useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = useState("");

  const [optimisticFolders, setOptimisticFolders] = useOptimistic(folders);
  const [optimisticFiles, setOptimisticFiles] = useOptimistic(files);

  function createFolderToggle() {
    if (subscription?.status !== "active" && optimisticFolders.length >= 3) {
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
      optimisticFiles.filter((f) => f.folderId === folderId).length >= 3
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

    setOptimisticFolders((prev) => [...prev, newFolder]);

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

    setOptimisticFiles((state) => [...state, newFile]);

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
    // TODO: ui not updating as expected
    setOptimisticFolders((state) => state.filter((f) => f.id !== folderId));

    toast.promise(deleteFolder(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted.",
      error: "Something went wrong! Unable to delete folder.",
    });
  }

  async function deleteFileHandler(fileId: string) {
    // TODO: ui not updating as expected
    setOptimisticFiles((state) => state.filter((f) => f.id !== fileId));

    toast.promise(deleteFile(fileId), {
      loading: "Deleting file...",
      success: "File deleted.",
      error: "Something went wrong! Unable to delete file.",
    });
  }

  return (
    <div className="flex w-full flex-col items-center overflow-hidden">
      <HoverCard
        open={isCreatingFolder}
        onOpenChange={(o) => setIsCreatingFolder(o)}
        openDelay={0}
        closeDelay={0}
      >
        <HoverCardTrigger asChild>
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        </HoverCardTrigger>

        <HoverCardContent side="right" className="w-96">
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
                  <FolderIcon className="h-5 w-5" />
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
        </HoverCardContent>
      </HoverCard>

      <ScrollArea className="w-full">
        <div className="flex flex-col items-center">
          {optimisticFolders.map(({ id, iconId, title }) => {
            const folderFiles = optimisticFiles.filter(
              (f) => f.folderId === id
            );

            return (
              // TODO: migrate to `NavigationMenu` component
              <HoverCard key={id} openDelay={0} closeDelay={0}>
                <HoverCardTrigger asChild>
                  <Button size="icon" variant="ghost">
                    {!iconId ?
                      <FolderIcon className="h-5 w-5" />
                    : <span className="text-lg">{iconId}</span>}
                  </Button>
                </HoverCardTrigger>

                <HoverCardContent side="right" sideOffset={5}>
                  <header className="flex items-center justify-between">
                    <h3 className="flex text-lg font-semibold leading-none tracking-tight">
                      {iconId ?
                        <span className="text-lg">{iconId}</span>
                      : <FolderIcon className="h-5 w-5" />}
                      <span className="ml-2">{title}</span>
                    </h3>

                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => createFileToggle(id!)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <FilePlus2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={currentlyInDev}
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => deleteFolderHandler(id!)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <Trash className="h-4 w-4" />
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
                            className="absolute inset-y-0 left-1 my-auto inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
                          >
                            {!selectedEmoji ?
                              <FileIcon className="h-4 w-4" />
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
                            className="absolute inset-y-0 right-1 my-auto h-7 w-7 text-muted-foreground"
                          >
                            <Check className="h-4 w-4" />
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
                                  : <FileIcon className="h-4 w-4" />}
                                </span>
                                {title}
                              </Link>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={currentlyInDev}
                                className="invisible z-10 ml-auto h-7 w-7 shrink-0 text-muted-foreground group-hover:visible"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteFileHandler(id!)}
                                className="invisible z-10 h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500 group-hover:visible"
                              >
                                <Trash className="h-4 w-4" />
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
                    </div>

                    <ScrollBar />
                  </ScrollArea>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        <ScrollBar />
      </ScrollArea>
    </div>
  );
}
