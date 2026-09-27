"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { SidebarPanel } from "./sidebar-panel";

type SidebarProps = React.ComponentProps<"aside"> & {
  isCollapsed: boolean;
};

export function Sidebar({ isCollapsed, className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn("relative z-40 hidden lg:block", className)}
      {...props}
    >
      <div
        className={cn(
          "sticky inset-y-0 flex h-screen flex-col gap-2",
          !isCollapsed && "overflow-hidden",
        )}
      >
        <SidebarPanel isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
