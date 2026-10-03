"use client";

import React from "react";
import {
  Delete02Icon,
  GridIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import type { IconSvgElement } from "@hugeicons/react";

import { siteConfig } from "@/config/site";
import { usePageAccess } from "@/hooks/use-app-state";
import { Logo } from "../icons";
import { Settings } from "../settings";
import { Trash } from "../trash";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "../ui/sidebar";
import { Workspaces } from "../workspaces";
import { DocumentTree } from "./document-tree";
import { DocumentTreeCollapsed } from "./document-tree-collapsed";
import { NavDialog } from "./nav-dialog";
import { SidebarUser } from "./sidebar-user";

type SidebarNavItem = {
  title: string;
  description: string;
  viewerDescription?: string;
  icon: IconSvgElement;
  content: React.FC;
};

const sidebarNavItems: SidebarNavItem[] = [
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
    viewerDescription: "Browse pages in the trash",
    icon: Delete02Icon,
    content: Trash,
  },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  // The mobile sheet always shows the full sidebar, whatever the desktop state.
  const isCollapsed = state === "collapsed" && !isMobile;
  const isViewer = usePageAccess() === "view";

  return (
    <Sidebar collapsible="icon" className="h-dvh">
      <SidebarHeader className="h-14 flex-row items-center gap-2 border-b px-2">
        <Logo size={40} className="shrink-0" />
        <span className="truncate font-handwriting text-2xl font-medium lowercase group-data-[collapsible=icon]:hidden">
          {siteConfig.name}
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavItems.map(
                ({
                  title,
                  description,
                  viewerDescription,
                  icon,
                  content: Content,
                }) => (
                  <NavDialog
                    key={title}
                    title={title}
                    icon={icon}
                    description={
                      isViewer && viewerDescription ? viewerDescription : (
                        description
                      )
                    }
                  >
                    <Content />
                  </NavDialog>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0 hidden group-data-[collapsible=icon]:block" />

        {isCollapsed ?
          <DocumentTreeCollapsed />
        : <DocumentTree />}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarUser isCollapsed={isCollapsed} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
