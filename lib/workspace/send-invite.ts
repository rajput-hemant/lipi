type WorkspaceInviteEmail = {
  to: string;
  workspaceTitle: string;
  acceptUrl: string;
};

export async function sendWorkspaceInviteEmail(
  payload: WorkspaceInviteEmail,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info("[workspace-invite]", payload);
  }
}
