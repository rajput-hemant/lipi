import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppStateProvider } from "@/components/app-state-provider";
import { WorkspaceRealtimeProvider } from "@/components/realtime/workspace-realtime-provider";
import { WorkspaceAccessRevoked } from "@/components/workspace-access-revoked";
import { getCurrentUser } from "@/lib/auth";
import { isSidebarOpen, SIDEBAR_COOKIE } from "@/lib/dashboard/sidebar-cookie";
import {
  getRequestDocuments,
  getRequestMembership,
} from "@/lib/dashboard/workspace-request";
import { MutationAuthError } from "@/lib/db/data/mutation-auth";
import { WorkspaceShell } from "../components/workspace-shell";

export const instant = false;

export const WorkspaceLayout: React.FCC<{
  params: Promise<{ workspaceId: string }>;
}> = async ({ params, children }) => {
  const { workspaceId } = await params;

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  let membership;
  try {
    membership = await getRequestMembership(user.id, workspaceId);
  } catch (error) {
    // A removed member's open session lands here; production strips thrown
    // messages, so render the state instead of letting the boundary show it.
    if (error instanceof MutationAuthError && error.code === "FORBIDDEN") {
      return <WorkspaceAccessRevoked />;
    }
    throw error;
  }
  const { workspace, role } = membership;

  const cookieStore = await cookies();

  const defaultOpen = isSidebarOpen(cookieStore.get(SIDEBAR_COOKIE)?.value);

  const documents = await getRequestDocuments(workspaceId);

  return (
    <AppStateProvider
      key={workspaceId}
      user={user}
      workspace={workspace}
      role={role}
      documents={documents}
    >
      <WorkspaceRealtimeProvider workspaceId={workspaceId}>
        <WorkspaceShell defaultOpen={defaultOpen}>{children}</WorkspaceShell>
      </WorkspaceRealtimeProvider>
    </AppStateProvider>
  );
};

export default WorkspaceLayout;
