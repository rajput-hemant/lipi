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
      direction="horizontal"
      onLayout={(sizes) => {
        setCookie("react-resizable-panels:layout", JSON.stringify(sizes));
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
          setCookie("react-resizable-panels:collapsed", false);
        }}
        onCollapse={() => {
          setIsCollapsed(true);
          setCookie("react-resizable-panels:collapsed", true);
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

      <ResizablePanel defaultSize={defaultLayout[1]}>
        <Navbar />
        <main className="overflow-auto">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
