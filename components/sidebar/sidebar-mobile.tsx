"use client";

import React from "react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarPanel } from "./sidebar-panel";

export function SidebarMobile() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden" aria-label="Open navigation menu">
        <HugeiconsIcon
          icon={Menu01Icon}
          strokeWidth={2}
          className="mr-2 size-5"
        />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-2rem,22rem)] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Workspace navigation and pages</SheetDescription>
        </SheetHeader>
        <SidebarPanel showBrand className="h-full px-0 pb-4 pt-2" />
      </SheetContent>
    </Sheet>
  );
}
