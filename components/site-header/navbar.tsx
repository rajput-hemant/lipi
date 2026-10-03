import { DocumentCollaborators } from "@/components/realtime/document-collaborators";
import { SearchCommand } from "@/components/search-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DocumentBreadcrumbs } from "./document-breadcrumbs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <SidebarTrigger />
          <DocumentBreadcrumbs />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DocumentCollaborators />
          <SearchCommand className="md:w-56 lg:w-80" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
