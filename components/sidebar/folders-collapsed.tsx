"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Edit2, File, FolderIcon, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { Folder } from "@/types/db";
import { createFolder, deleteFolder } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { EmojiPicker } from "../emoji-picker";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

type FoldersCollapsedProps = {
  folders: Folder[];
};

export function FoldersCollapsed({ folders }: FoldersCollapsedProps) {
  const pathname = usePathname();

  const [folderName, setFolderName] = React.useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);

  const [optimisticFolders, setOptimisticFolders] =
    React.useOptimistic(folders);

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
                onClick={() => setIsCreatingFolder(false)}
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
          {optimisticFolders.map(({ id, iconId, title }) => (
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
                      size="icon"
                      variant="ghost"
                      onClick={currentlyInDev}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteFolderHandler(id!)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </header>

                <ScrollArea>
                  <div className="max-h-[320px]">
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
                  </div>

                  <ScrollBar />
                </ScrollArea>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>

        <ScrollBar />
      </ScrollArea>
    </div>
  );
}
