"use client";

import React from "react";
import { setCookie } from "cookies-next";

import { Sidebar } from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/site-header/navbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  RESIZABLE_COLLAPSED_COOKIE,
  RESIZABLE_LAYOUT_COOKIE,
} from "@/lib/dashboard/resizable-layout-cookies";
import { cn } from "@/lib/utils";

type ResizableLayoutProps = {
  defaultLayout: number[];
  defaultCollapsed: boolean;
  children: React.ReactNode;
};

export function ResizableLayout(props: ResizableLayoutProps) {
  const {
    defaultLayout = [16, 84],
    defaultCollapsed = false,
    children,
  } = props;

  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChange={(layout) => {
        const sizes = [layout.sidebar, layout.main].filter(
          (size): size is number => typeof size === "number"
        );
        if (sizes.length > 0) {
          const total = sizes.reduce((sum, size) => sum + size, 0);
          setCookie(
            RESIZABLE_LAYOUT_COOKIE,
            JSON.stringify(sizes.map((size) => (size / total) * 100))
          );
        }
      }}
    >
      <ResizablePanel
        id="sidebar"
        defaultSize={`${defaultLayout[0]}%`}
        collapsedSize="3%"
        collapsible={true}
        minSize="14%"
        maxSize="20%"
        onResize={(size) => {
          const collapsed = size.asPercentage <= 3;
          setIsCollapsed((previous) => {
            if (previous !== collapsed) {
              setCookie(RESIZABLE_COLLAPSED_COOKIE, collapsed);
            }
            return collapsed;
          });
        }}
        className={cn(
          "hidden lg:block",
          isCollapsed &&
            "min-w-14 !overflow-visible transition-all duration-300 ease-in-out"
        )}
      >
        <Sidebar isCollapsed={isCollapsed} />
      </ResizablePanel>

      <ResizableHandle withHandle className="hidden lg:flex" />

      <ResizablePanel id="main" defaultSize={`${defaultLayout[1]}%`}>
        <Navbar />
        <main className="overflow-auto">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
