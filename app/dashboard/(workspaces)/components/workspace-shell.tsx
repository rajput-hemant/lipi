"use client";

import React from "react";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Navbar } from "@/components/site-header/navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

// The editor handles Mod+B as bold and marks the event handled, but the
// provider's window listener ignores that, so stop it before it gets there.
function keepEditorBold(event: React.KeyboardEvent) {
  if (
    event.defaultPrevented &&
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "b"
  ) {
    event.stopPropagation();
  }
}

export function WorkspaceShell({
  defaultOpen,
  children,
}: React.PropsWithChildren<{ defaultOpen: boolean }>) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      // dvh follows the mobile URL bar; the 3.5rem icon rail matches the
      // header height; sidebar transitions honour reduced motion.
      className="min-h-dvh motion-reduce:[&_[data-slot=sidebar-container]]:transition-none motion-reduce:[&_[data-slot=sidebar-gap]]:transition-none"
      style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
    >
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <Navbar />
        <main
          id="main-content"
          className="overflow-auto"
          onKeyDown={keepEditorBold}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
