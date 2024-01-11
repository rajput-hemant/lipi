import React from "react";
import Link from "next/link";
import { LayoutGrid, Settings, Trash2, User2 } from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { User } from "next-auth";
import type { File, Folder } from "@/types/db";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "../icons";
import { SignOut } from "../sign-out";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { buttonVariants } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Folders } from "./folders";
import { FoldersCollapsed } from "./folders-collapsed";

type SidebarProps = React.ComponentProps<"aside"> & {
  user: User;
  files: File[];
  folders: Folder[];
  isCollapsed: boolean;
};

type NavLinkProps = {
  title: string;
  href: Route;
  icon: React.ReactNode;
  isCollapsed?: boolean;
};

type NavItem = { title: string; icon: LucideIcon; href: Route };

const navItems: NavItem[] = [
  {
    title: "My Workspaces",
    icon: LayoutGrid,
    href: "/dashboard",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard",
  },
  {
    title: "Trash",
    icon: Trash2,
    href: "/dashboard",
  },
];

export function Sidebar(props: SidebarProps) {
  const { user, files, folders, isCollapsed, className, ...restProps } = props;

  return (
    <aside
      className={cn("relative z-40 hidden lg:block", className)}
      {...restProps}
    >
      <div
        className={cn(
          "sticky inset-y-0 flex h-screen flex-col gap-2",
          !isCollapsed && "overflow-hidden"
        )}
      >
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

        <nav className="flex flex-col items-center justify-center gap-1 px-4">
          {navItems.map(({ title, href, icon: Icon }) =>
            isCollapsed ?
              <Tooltip key={title} delayDuration={0}>
                <TooltipTrigger>
                  <NavLink
                    title={title}
                    href={href}
                    icon={<Icon className="h-5 w-5" />}
                    isCollapsed
                  />
                </TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
              </Tooltip>
            : <NavLink
                key={title}
                title={title}
                href={href}
                icon={<Icon className="mr-2 h-4 w-4 shrink-0" />}
              />
          )}
        </nav>

        <Separator className={isCollapsed ? "block" : "hidden"} />

        {isCollapsed ?
          <FoldersCollapsed files={files} folders={folders} />
        : <Folders files={files} folders={folders} />}

        <div
          className={cn(
            "absolute z-10 transition-all animate-in fade-in-0 zoom-in-0 slide-in-from-bottom-full [animation-duration:500ms]",
            isCollapsed ? "inset-x-0 bottom-1" : (
              "inset-x-2 bottom-2 flex items-center gap-2 rounded-full border bg-background/10 p-2 shadow backdrop-blur-md hover:shadow-xl"
            )
          )}
        >
          {isCollapsed ?
            <Popover>
              <PopoverTrigger className="mx-auto flex rounded-full border p-0.5 shadow hover:shadow-xl">
                <Avatar>
                  <AvatarImage
                    src={user.image ?? undefined}
                    className="rounded-full"
                  />

                  <AvatarFallback className="cursor-pointer bg-background hover:bg-muted">
                    <User2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>

              <PopoverContent side="right" className="flex justify-between">
                <div className="w-full font-medium">
                  <p className="line-clamp-1 text-sm">
                    {user.name ?? "Update your profile"}
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
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>
                  <User2 className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="w-full font-medium">
                <p className="line-clamp-1 text-sm">
                  {user.name ?? "Update your profile"}
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
    </aside>
  );
}

function NavLink({ title, href, icon, isCollapsed }: NavLinkProps) {
  return (
    <Link
      key={title}
      href={href}
      className={cn(
        buttonVariants({ size: isCollapsed ? "icon" : "sm", variant: "ghost" }),
        !isCollapsed && "w-full justify-start"
      )}
    >
      {icon}
      {!isCollapsed && title}
    </Link>
  );
}
