"use client";

import React from "react";
import type { User } from "next-auth";

import type { Folder } from "@/types/db";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarCollapsed } from "@/components/sidebar/sidebar-collapsed";
import { Navbar } from "@/components/site-header/navbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type ResizableLayoutProps = {
  user: User;
  folders: Folder[] | null;
  defaultLayout: number[];
  defaultCollapsed: boolean;
  children: React.ReactNode;
};

export function ResizableLayout({
  user,
  folders,
  defaultLayout = [16, 84],
  defaultCollapsed = false,
  children,
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={3}
        collapsible={true}
        minSize={10}
        maxSize={20}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            false
          )}`;
        }}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            true
          )}`;
        }}
        className={cn(
          "hidden lg:block",
          isCollapsed &&
            "min-w-[3.5rem] transition-all duration-300 ease-in-out"
        )}
      >
        {isCollapsed ? (
          <SidebarCollapsed user={user} folders={folders} />
        ) : (
          <Sidebar user={user} folders={folders} />
        )}
      </ResizablePanel>

      <ResizableHandle withHandle className="hidden lg:flex" />

      <ResizablePanel defaultSize={defaultLayout[1]}>
        <Navbar />
        <main className="overflow-auto">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
