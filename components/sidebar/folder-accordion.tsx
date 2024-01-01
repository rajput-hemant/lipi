import React, { useOptimistic } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronDown,
  Edit2,
  File,
  FolderIcon,
  FolderOpen,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import type { Folder } from "@/types/db";
import { createFolder } from "@/lib/db/queries";
import { cn, isAppleDevice } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EmojiPicker } from "../emoji-picker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Kbd } from "../ui/kbd";

type FolderAccordionProps = {
  folders: Folder[];
  isCreatingFolder: boolean;
  setIsCreatingFolder: (isCreatingFolder: boolean) => void;
};

export function FolderAccordion(props: FolderAccordionProps) {
  const { folders, isCreatingFolder, setIsCreatingFolder } = props;

  const pathname = usePathname();

  const [openedFolders, setOpenedFolders] = React.useState<string[]>([]);
  const [folderName, setFolderName] = React.useState("Untitled");
  const [selectedEmoji, setSelectedEmoji] = React.useState("");

  const [optimisticFolders, setOptimisticFolders] = useOptimistic(
    folders,
    (state, newFolder: Folder) => [newFolder, ...state]
  );

  async function createFolderHandler() {
    const newFolder: Folder = {
      title: folderName,
      iconId: selectedEmoji,
      workspaceId: pathname.split("/")[2],
    };

    setOptimisticFolders(newFolder);

    toast.promise(createFolder(newFolder), {
      loading: "Creating folder...",
      success: "Folder created.",
      error: "Something went wrong! Unable to create folder.",
    });

    setIsCreatingFolder(false);
    setFolderName("");
  }

  function currentlyInDev() {
    toast("This feature is currently in development.", {
      description: "We're working on it and it'll be available soon.",
    });
  }

  return (
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
            {!selectedEmoji ? (
              <FolderIcon className="h-4 w-4" />
            ) : (
              selectedEmoji
            )}
          </EmojiPicker>

          <Input
            type="text"
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="h-9 px-9"
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

      {optimisticFolders.map(({ id, title }) => (
        <AccordionItem key={id} value={id!} className="my-px border-none">
          <ContextMenu>
            <ContextMenuTrigger>
              <AccordionTrigger
                showIndicator={false}
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "justify-start border-none hover:no-underline data-[state=open]:bg-secondary"
                )}
              >
                {openedFolders.includes(id!) ? (
                  <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                ) : (
                  <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
                )}

                {title}

                <ChevronDown className="invisible ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-hover/trigger:visible group-data-[state=open]/trigger:visible group-data-[state=open]/trigger:rotate-180" />
              </AccordionTrigger>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={currentlyInDev}>
                <File className="mr-2 h-4 w-4 shrink-0" />
                New File
                <Kbd className="ml-auto">
                  {!isAppleDevice() ? "⌘" : "Ctrl"} N
                </Kbd>
              </ContextMenuItem>
              <ContextMenuItem onClick={currentlyInDev}>
                <Edit2 className="mr-2 h-4 w-4 shrink-0" />
                Rename
                <Kbd className="ml-auto">
                  {!isAppleDevice() ? "⌘" : "Ctrl"} E
                </Kbd>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={currentlyInDev}
                className="!text-red-500"
              >
                <Trash className="mr-2 h-4 w-4 shrink-0" />
                Delete
                <Kbd className="ml-auto">
                  {!isAppleDevice() ? "⌘" : "Ctrl"} D
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
  );
}
