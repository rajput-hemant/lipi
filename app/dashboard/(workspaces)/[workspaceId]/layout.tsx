import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppStateProvider } from "@/components/app-state-provider";
import { WorkspaceRealtimeProvider } from "@/components/realtime/workspace-realtime-provider";
import { getCurrentUser } from "@/lib/auth";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/lib/dashboard/sidebar-cookie";
import { getDocuments } from "@/lib/db/queries";
import { getWorkspaceMembershipRole } from "@/lib/db/queries/mutation-auth";
import { WorkspaceShell } from "../components/workspace-shell";

export const instant = false;

export const WorkspaceLayout: React.FCC<{
  params: Promise<{ workspaceId: string }>;
}> = async ({ params, children }) => {
  const { workspaceId } = await params;

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { workspace, role } = await getWorkspaceMembershipRole(
    user.id,
    workspaceId
  );

  const cookieStore = await cookies();

  const defaultCollapsed =
    cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "true";

  const documents = await getDocuments(workspaceId);

  return (
    <AppStateProvider
      key={workspaceId}
      user={user}
      workspace={workspace}
      role={role}
      documents={documents}
    >
      <WorkspaceRealtimeProvider workspaceId={workspaceId}>
        <WorkspaceShell defaultCollapsed={defaultCollapsed}>
          {children}
        </WorkspaceShell>
      </WorkspaceRealtimeProvider>
    </AppStateProvider>
  );
};

export default WorkspaceLayout;
