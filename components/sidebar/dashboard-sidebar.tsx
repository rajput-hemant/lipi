"use client";

import Link from "next/link";
import { LayoutGrid, LogOut, Plus, Settings, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Logo } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button, buttonVariants } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { FolderAccordion } from "./folder-accordion";

type SidebarProps = React.ComponentProps<"aside">;

export function DashboardSidebar({ className, ...props }: SidebarProps) {
  async function signOutHandler() {
    const { dismiss } = toast({
      title: "Signing out...",
      description: "Please wait while we sign you out.",
    });

    await signOut();
    dismiss();
  }

  return (
    <aside
      className={cn(
        "z-40 hidden w-1/5 max-w-[18rem] border-r lg:block",
        className
      )}
      {...props}
    >
      <div className="sticky inset-y-0 flex h-screen flex-col gap-2 overflow-hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <Logo size={36} />
          <p className="font-handwriting text-2xl lowercase">
            {siteConfig.name}
          </p>
        </div>

        <div className="space-y-1 px-4">
          <Dialog>
            <DialogTrigger
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
                "w-full justify-start"
              )}
            >
              <LayoutGrid className="mr-2 h-4 w-4 shrink-0" />
              My Workspaces
            </DialogTrigger>
            <DialogContent>All Workspaces</DialogContent>
          </Dialog>

          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "w-full justify-start"
            )}
          >
            <Settings className="mr-2 h-4 w-4 shrink-0" />
            Settings
          </Link>

          <Dialog>
            <DialogTrigger
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                "w-full justify-start"
              )}
            >
              <Trash2 className="mr-2 h-4 w-4 shrink-0" />
              Trash
            </DialogTrigger>
            <DialogContent>Trash</DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between px-4">
          <p className="text-sm font-medium text-muted-foreground">Folders</p>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="-mb-2 flex grow flex-col gap-1 overflow-hidden pr-1">
          <ScrollArea>
            <FolderAccordion />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        <div className="flex items-center gap-2 border-t p-2">
          <Avatar>
            <AvatarImage src="https://github.com/rajput-hemant.png" />
            <AvatarFallback>~</AvatarFallback>
          </Avatar>

          <p className="truncate text-sm font-medium">
            {siteConfig.author.name}
          </p>

          <Button
            size="icon"
            variant="ghost"
            onClick={signOutHandler}
            className="ml-auto"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
