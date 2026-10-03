"use client";

import React from "react";

import { Sidebar } from "@/components/sidebar/sidebar";
import {
  SIDEBAR_ID,
  SidebarStateProvider,
  useSidebarState,
} from "@/components/sidebar/sidebar-state";
import { Navbar } from "@/components/site-header/navbar";
import { cn } from "@/lib/utils";

function WorkspaceShellContent({ children }: React.PropsWithChildren) {
  const { isCollapsed } = useSidebarState();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        id={SIDEBAR_ID}
        isCollapsed={isCollapsed}
        className={cn("shrink-0 border-r", isCollapsed ? "w-14" : "w-64")}
      />
      <div className="min-w-0 flex-1">
        <Navbar />
        <main id="main-content" className="overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function WorkspaceShell({
  defaultCollapsed,
  children,
}: React.PropsWithChildren<{ defaultCollapsed: boolean }>) {
  return (
    <SidebarStateProvider defaultCollapsed={defaultCollapsed}>
      <WorkspaceShellContent>{children}</WorkspaceShellContent>
    </SidebarStateProvider>
  );
}
