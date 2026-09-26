import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarMobile } from "../sidebar/sidebar-mobile";
import { DocumentBreadcrumbs } from "./document-breadcrumbs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center px-4">
        <SidebarMobile />
        <DocumentBreadcrumbs />

        <div className="flex flex-1 justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
