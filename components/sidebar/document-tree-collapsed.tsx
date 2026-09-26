"use client";

import { File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { DocumentTree } from "./document-tree";

export function DocumentTreeCollapsed() {
  return (
    <NavigationMenu className="max-w-full justify-center">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="size-9 p-0" aria-label="Open pages">
            <HugeiconsIcon
              icon={File01Icon}
              strokeWidth={2}
              className="size-5"
            />
          </NavigationMenuTrigger>
          <NavigationMenuContent className="w-72 p-0">
            <div className="max-h-96 overflow-hidden">
              <DocumentTree />
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
