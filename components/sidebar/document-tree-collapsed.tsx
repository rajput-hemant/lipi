"use client";

import { File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { DocumentTree } from "./document-tree";

export function DocumentTreeCollapsed() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <SidebarMenuButton
              tooltip="Pages"
              aria-label="Open pages"
              render={<PopoverTrigger />}
            >
              <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
            </SidebarMenuButton>
            <PopoverContent side="right" align="start" className="w-72 p-0">
              <div className="max-h-[min(24rem,70dvh)] overflow-y-auto">
                <DocumentTree />
              </div>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
