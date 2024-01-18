import React from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SidebarMobile() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden">
        <Menu className="mr-2 size-5" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
        </SheetHeader>
        <div className="h-full bg-background">
          <p>Content</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
