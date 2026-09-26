"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cancel01Icon,
  Delete01Icon,
  Edit02Icon,
  File01Icon,
  FileAddIcon,
  FileNotFoundIcon,
  Folder01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { File, Folder } from "@/types/db";

import { useAppState } from "@/hooks/use-app-state";
import {
  createFile,
  createFolder,
  deleteFileFromDb,
  deleteFolderFromDb,
  updateFileInDb,
  updateFolderInDb,
} from "@/lib/db/queries";
import { AlertDialogCloseAction } from "@/components/alert-dialog-close-action";
import { hideNavigationMenuTriggerIndicator } from "@/lib/shadcn-call-site";
import { cn, currentlyInDev } from "@/lib/utils";
import { EmojiPicker } from "../emoji-picker";
import { useSubscriptionModal } from "../subscription-modal-provider";
import {
  AlertDialog,
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
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import {
  VerticalNavigationMenu,
  verticalNavigationMenuListClassName,
} from "./vertical-navigation-menu";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function FoldersCollapsed() {
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

  const [folderName, setFolderName] = useState("Untitled");
  const [fileName, setFileName] = useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [creatingFiles, setCreatingFiles] = useState<string[]>([]);

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
      error: () => {
        deleteFolder(newFolder.id!);
        return "Something went wrong! Unable to create folder.";
      },
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

    toast.promise(updateFolderInDb(updatedFolder), {
      loading: "Moving folder to trash...",
      success: "Folder moved to trash.",
      error: "Something went wrong! Unable to move folder to trash.",
    });
  }

  async function deleteFileHandler(fileId: string) {
    const file = files.find((f) => f.id === fileId);
    deleteFile(fileId);

    toast.promise(deleteFileFromDb(fileId), {
      loading: "Deleting file...",
      success: "File deleted permanently.",
      error: () => {
        addFile(file!);
        return "Something went wrong! Unable to delete file.";
      },
    });
  }

  async function deleteFolderHandler(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);
    deleteFolder(folderId);

    toast.promise(deleteFolderFromDb(folderId), {
      loading: "Deleting folder...",
      success: "Folder deleted permanently.",
      error: () => {
        addFolder(folder!);
        return "Something went wrong! Unable to delete folder.";
      },
    });
  }

  return (
    <VerticalNavigationMenu className="max-w-none items-start">
      <NavigationMenuList className={verticalNavigationMenuListClassName}>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              hideNavigationMenuTriggerIndicator,
              "size-10 p-0"
            )}
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-5"
            />
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
                    <HugeiconsIcon
                      icon={Folder01Icon}
                      strokeWidth={2}
                      className="size-5"
                    />
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
                className={cn(
                  hideNavigationMenuTriggerIndicator,
                  "size-10 p-0"
                )}
              >
                {!iconId ?
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                : <span className="text-lg">{iconId}</span>}
              </NavigationMenuTrigger>

              <NavigationMenuContent className="min-w-80 space-y-4 p-4">
                <header className="flex items-center justify-between">
                  <h3 className="flex text-lg font-semibold leading-none tracking-tight">
                    {iconId ?
                      <span className="text-lg">{iconId}</span>
                    : <HugeiconsIcon
                        icon={Folder01Icon}
                        strokeWidth={2}
                        className="size-5"
                      />
                    }
                    <span className="ml-2">{title}</span>
                  </h3>

                  <div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            onClick={() => createFileToggle(id!)}
                            className="size-7 p-0 text-muted-foreground"
                          >
                            {creatingFiles.includes(id!) ?
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                strokeWidth={2}
                                className="size-4"
                              />
                            : <HugeiconsIcon
                                icon={FileAddIcon}
                                strokeWidth={2}
                                className="size-4"
                              />
                            }
                          </Button>
                        }
                      />
                      <TooltipContent>
                        {creatingFiles.includes(id!) ?
                          "Cancel creating file"
                        : "Create file"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            onClick={currentlyInDev}
                            className="size-7 p-0 text-muted-foreground"
                          >
                            <HugeiconsIcon
                              icon={Edit02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>Edit folder</TooltipContent>
                    </Tooltip>

                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  className="size-7 p-0 text-muted-foreground hover:text-red-500"
                                >
                                  <HugeiconsIcon
                                    icon={Delete01Icon}
                                    strokeWidth={2}
                                    className="size-4"
                                  />
                                </Button>
                              }
                            />
                          }
                        />
                        <TooltipContent>Delete folder</TooltipContent>
                      </Tooltip>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogCloseAction
                            onClick={() => moveFolderToTrash(id!)}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/15"
                          >
                            Move to trash
                          </AlertDialogCloseAction>
                          <AlertDialogCloseAction
                            onClick={() => deleteFolderHandler(id!)}
                            className={buttonVariants({
                              variant: "destructive",
                            })}
                          >
                            Delete
                          </AlertDialogCloseAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </header>

                <ScrollArea>
                  <div className="max-h-[320px]">
                    {creatingFiles.includes(id!) && (
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
                            <HugeiconsIcon
                              icon={File01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
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
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </Button>
                      </form>
                    )}

                    {creatingFiles.includes(id!) || folderFiles.length ?
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
                              : <HugeiconsIcon
                                  icon={File01Icon}
                                  strokeWidth={2}
                                  className="size-4"
                                />
                              }
                            </span>
                            {title}
                          </Link>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={currentlyInDev}
                                  className="invisible z-10 ml-auto size-7 shrink-0 text-muted-foreground group-hover:visible"
                                >
                                  <HugeiconsIcon
                                    icon={Edit02Icon}
                                    strokeWidth={2}
                                    className="size-4"
                                  />
                                </Button>
                              }
                            />
                            <TooltipContent>Edit file</TooltipContent>
                          </Tooltip>

                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="invisible z-10 size-7 shrink-0 text-muted-foreground hover:text-red-500 group-hover:visible"
                                      >
                                        <HugeiconsIcon
                                          icon={Delete01Icon}
                                          strokeWidth={2}
                                          className="size-4"
                                        />
                                      </Button>
                                    }
                                  />
                                }
                              />
                              <TooltipContent>Delete file</TooltipContent>
                            </Tooltip>

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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogCloseAction
                                  onClick={() => moveFileToTrash(id!)}
                                  className="bg-destructive/10 text-destructive hover:bg-destructive/15"
                                >
                                  Move to trash
                                </AlertDialogCloseAction>
                                <AlertDialogCloseAction
                                  onClick={() => deleteFileHandler(id!)}
                                  className={buttonVariants({
                                    variant: "destructive",
                                  })}
                                >
                                  Delete
                                </AlertDialogCloseAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    : <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-muted-foreground">
                        <HugeiconsIcon
                          icon={FileNotFoundIcon}
                          strokeWidth={2}
                          size={20}
                        />

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
    </VerticalNavigationMenu>
  );
}
