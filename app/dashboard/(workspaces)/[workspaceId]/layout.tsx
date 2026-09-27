import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppStateProvider } from "@/components/app-state-provider";
import { WorkspaceRealtimeProvider } from "@/components/realtime/workspace-realtime-provider";
import { getCurrentUser } from "@/lib/auth";
import { getDocuments } from "@/lib/db/queries";
import { assertWorkspaceAccess } from "@/lib/db/queries/mutation-auth";
import {
  RESIZABLE_COLLAPSED_COOKIE,
  RESIZABLE_LAYOUT_COOKIE,
} from "@/lib/dashboard/resizable-layout-cookies";
import { ResizableLayout } from "../components/resizable-layout";

export const instant = false;

export const WorkspaceLayout: React.FCC<{
  params: Promise<{ workspaceId: string }>;
}> = async ({ params, children }) => {
  const { workspaceId } = await params;

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  await assertWorkspaceAccess(user.id, workspaceId);

  const cookieStore = await cookies();

  const layout = cookieStore.get(RESIZABLE_LAYOUT_COOKIE);
  const collapsed = cookieStore.get(RESIZABLE_COLLAPSED_COOKIE);

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  const documents = await getDocuments(workspaceId);

  return (
    <AppStateProvider key={workspaceId} user={user} documents={documents}>
      <WorkspaceRealtimeProvider workspaceId={workspaceId}>
        <ResizableLayout
          defaultLayout={defaultLayout as number[]}
          defaultCollapsed={defaultCollapsed as boolean}
        >
          {children}
        </ResizableLayout>
      </WorkspaceRealtimeProvider>
    </AppStateProvider>
  );
};

export default WorkspaceLayout;
