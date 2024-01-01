"use client";

import Link from "next/link";
import { LayoutGrid, Settings, Trash2, User2 } from "lucide-react";
import type { User } from "next-auth";

import type { Folder } from "@/types/db";
import { cn } from "@/lib/utils";
import { Logo } from "../icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { buttonVariants } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type SidebarCollapsedProps = React.ComponentProps<"aside"> & {
  user: User;
  folders: Folder[];
};

export function SidebarCollapsed(props: SidebarCollapsedProps) {
  const { user, className, ...restProps } = props;

  return (
    <aside
      className={cn("relative z-40 hidden lg:block", className)}
      {...restProps}
    >
      <div className="sticky inset-y-0 flex h-screen flex-col gap-2 overflow-hidden">
        <div className="my-px flex h-14 border-b">
          <Logo size={44} className="m-auto shrink-0" />
        </div>

        <div className="flex flex-col items-center">
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Link
                href="/dashboard"
                className={buttonVariants({ size: "icon", variant: "ghost" })}
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">My Workspaces</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Link
                href="/dashboard"
                className={buttonVariants({ size: "icon", variant: "ghost" })}
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <Link
                href="/dashboard"
                className={buttonVariants({ size: "icon", variant: "ghost" })}
              >
                <Trash2 className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Trash</TooltipContent>
          </Tooltip>
        </div>
        <Separator />
        <div className=""></div>
        <div className="absolute inset-x-0 bottom-1">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mx-auto flex h-12 w-12 rounded-full border"
            )}
          >
            <Avatar>
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback>
                <User2 className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </aside>
  );
}
