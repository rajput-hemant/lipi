"use client";

import React from "react";

import type { User } from "next-auth";
import type { File, Folder } from "@/types/db";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/site-header/navbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

type ResizableLayoutProps = {
  user: User;
  files: File[];
  folders: Folder[];
  defaultLayout: number[];
  defaultCollapsed: boolean;
  children: React.ReactNode;
};

export function ResizableLayout(props: ResizableLayoutProps) {
  const {
    user,
    files,
    folders,
    defaultLayout = [16, 84],
    defaultCollapsed = false,
    children,
  } = props;

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
        minSize={14}
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
            "min-w-[3.5rem] !overflow-visible transition-all duration-300 ease-in-out"
        )}
      >
        <Sidebar
          user={user}
          files={files}
          folders={folders}
          isCollapsed={isCollapsed}
        />
      </ResizablePanel>

      <ResizableHandle withHandle className="hidden lg:flex" />

      <ResizablePanel defaultSize={defaultLayout[1]}>
        <Navbar />
        <main className="overflow-auto">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
