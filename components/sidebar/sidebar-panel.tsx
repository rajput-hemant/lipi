"use client";

import React from "react";
import {
  Delete02Icon,
  GridIcon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { IconSvgElement } from "@hugeicons/react";

import { siteConfig } from "@/config/site";
import { useAppState } from "@/hooks/use-app-state";
import { cn } from "@/lib/utils";
import { Logo } from "../icons";
import { Settings } from "../settings";
import { SignOut } from "../sign-out";
import { Trash } from "../trash";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Workspaces } from "../workspaces";
import { DocumentTree } from "./document-tree";
import { DocumentTreeCollapsed } from "./document-tree-collapsed";
import { NavDialog } from "./nav-dialog";

export type SidebarNavItem = {
  title: string;
  description: string;
  icon: IconSvgElement;
  content: React.FC;
};

export const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "My Workspaces",
    description: "Switch between owned and shared workspaces",
    icon: GridIcon,
    content: Workspaces,
  },
  {
    title: "Settings",
    description: "Workspace settings and members",
    icon: Settings01Icon,
    content: Settings,
  },
  {
    title: "Trash",
    description: "Restore or delete trashed pages",
    icon: Delete02Icon,
    content: Trash,
  },
];

type SidebarPanelProps = {
  isCollapsed?: boolean;
  showBrand?: boolean;
  className?: string;
};

export function SidebarPanel({
  isCollapsed = false,
  showBrand = true,
  className,
}: SidebarPanelProps) {
  const { user } = useAppState();

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      {showBrand && (
        <div
          className={cn(
            "flex",
            isCollapsed ?
              "my-px h-14 border-b"
            : "my-1 ml-4 mr-2 items-center gap-2"
          )}
        >
          <Logo size={44} className={cn("shrink-0", isCollapsed && "m-auto")} />
          {!isCollapsed && (
            <span className="font-handwriting text-2xl font-medium lowercase">
              {siteConfig.name}
            </span>
          )}
        </div>
      )}

      <nav className="flex flex-col items-center justify-center gap-1 px-4">
        {sidebarNavItems.map(
          ({ title, description, icon, content: Content }) =>
            isCollapsed ?
              <NavDialog
                key={title}
                title={title}
                icon={icon}
                description={description}
                isCollapsed
              >
                <Content />
              </NavDialog>
            : <NavDialog
                key={title}
                title={title}
                icon={icon}
                description={description}
              >
                <Content />
              </NavDialog>
        )}
      </nav>

      <Separator className={isCollapsed ? "block" : "hidden"} />

      <div
        data-testid={isCollapsed ? "document-tree-collapsed" : "document-tree"}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {isCollapsed ?
          <DocumentTreeCollapsed />
        : <DocumentTree />}
      </div>

      <div
        className={cn(
          "z-10 transition-all animate-in fade-in-0 zoom-in-0 slide-in-from-bottom-full [animation-duration:500ms]",
          isCollapsed ? "mt-auto pb-1" : (
            "mx-2 mb-2 flex items-center gap-2 rounded-full border bg-background/10 p-2 shadow backdrop-blur-md hover:shadow-xl"
          )
        )}
      >
        {isCollapsed ?
          <Popover>
            <PopoverTrigger
              aria-label="Account menu"
              className="mx-auto flex rounded-full border p-0.5 shadow hover:shadow-xl"
            >
              <Avatar>
                <AvatarImage
                  src={user?.image ?? undefined}
                  className="rounded-full"
                />
                <AvatarFallback className="cursor-pointer bg-background hover:bg-muted">
                  <HugeiconsIcon
                    icon={UserIcon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent side="right" className="flex justify-between">
              <div className="w-full font-medium">
                <p className="line-clamp-1 text-sm">
                  {user?.name ?? "Update your profile"}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  Free plan
                </p>
              </div>
              <SignOut
                size="icon"
                variant="ghost"
                className="ml-auto shrink-0 rounded-full text-muted-foreground"
              />
            </PopoverContent>
          </Popover>
        : <>
            <Avatar className="m-auto">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback>
                <HugeiconsIcon
                  icon={UserIcon}
                  strokeWidth={2}
                  className="size-6 text-muted-foreground"
                />
              </AvatarFallback>
            </Avatar>
            <div className="w-full font-medium">
              <p className="line-clamp-1 text-sm">
                {user?.name ?? "Update your profile"}
              </p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                Free plan
              </p>
            </div>
            <SignOut
              size="icon"
              variant="ghost"
              className="ml-auto shrink-0 rounded-full text-muted-foreground"
            />
          </>
        }
      </div>
    </div>
  );
}
