import { SearchCommand } from "@/components/search-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarMobile } from "../sidebar/sidebar-mobile";
import { DocumentBreadcrumbs } from "./document-breadcrumbs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <SidebarMobile />
          <DocumentBreadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          <SearchCommand />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
