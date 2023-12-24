"use client";

import Link from "next/link";
import {
  FolderX,
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  Trash2,
  User2,
} from "lucide-react";
import type { User } from "next-auth";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import type { Folder } from "@/types/db";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button, buttonVariants } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { FolderAccordion } from "./folder-accordion";

type SidebarProps = React.ComponentProps<"aside"> & {
  folders: Folder[] | null;
  user: User;
};

export function Sidebar({ user, folders, className, ...props }: SidebarProps) {
  async function signOutHandler() {
    // const { dismiss } = toast({
    //   title: "Signing out...",
    //   description: "Please wait while we sign you out.",
    // });

    toast.promise(signOut, {
      loading: "Signing out...",
      success: "You have been signed out.",
      error: "Something went wrong.",
    });
  }

  return (
    <aside
      className={cn("relative z-40 hidden lg:block", className)}
      {...props}
    >
      <div className="sticky inset-y-0 flex h-screen flex-col gap-2 overflow-hidden">
        <div className={cn("my-1 ml-4 mr-2 flex items-center gap-2")}>
          <Logo size={44} className={cn("shrink-0")} />
          <span className="font-handwriting text-2xl font-medium lowercase">
            {siteConfig.name}
          </span>
        </div>

        <div
          className={cn("flex flex-col items-center justify-center gap-1 px-4")}
        >
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({
                size: "sm",
                variant: "ghost",
              }),
              "w-full justify-start"
            )}
          >
            <LayoutGrid className={cn("mr-2 h-4 w-4 shrink-0")} />
            My Workspaces
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({
                size: "sm",
                variant: "ghost",
              }),
              "w-full justify-start"
            )}
          >
            <Settings className={cn("mr-2 h-4 w-4 shrink-0")} />
            Settings
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({
                size: "sm",
                variant: "ghost",
              }),
              "w-full justify-start"
            )}
          >
            <Trash2 className={cn("mr-2 h-4 w-4 shrink-0")} />
            Trash
          </Link>
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

        {folders?.length ? (
          <div className="-mb-2 flex grow flex-col gap-1 overflow-hidden">
            <ScrollArea>
              <FolderAccordion folders={folders} />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        ) : (
          <div className="mb-10 flex h-full flex-col items-center justify-center gap-4 px-4 text-muted-foreground">
            <FolderX size={32} />
            <p className="text-center text-sm">
              You don&apos;t have any folders yet.
            </p>
          </div>
        )}

        <div
          className={cn(
            "absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full border bg-background/10 p-2 shadow backdrop-blur-md transition-all duration-500 animate-in fade-in-0 zoom-in-0 slide-in-from-bottom-full hover:shadow-xl"
          )}
        >
          <Avatar className="m-auto">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback>
              <User2 className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="w-full font-medium">
            <p className="line-clamp-1 text-sm">
              {user.name ?? "Update your profile"}
            </p>
            <p className="text-xs text-muted-foreground">Free plan</p>
          </div>

          <Button
            title="Sign out"
            size="icon"
            variant="ghost"
            onClick={signOutHandler}
            className="ml-auto shrink-0 rounded-full text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
