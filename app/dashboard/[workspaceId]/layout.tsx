import React from "react";

import { DashboardSidebar } from "@/components/sidebar/dashboard-sidebar";

export default function WorkspaceLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="relative flex">
      <DashboardSidebar />

      <div className="w-full">
        <nav className="sticky top-0 z-40 h-14 w-full border-b">navbar</nav>

        <main className="h-[2000px] overflow-auto">{children}</main>
      </div>
    </div>
  );
}
