import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDefaultWorkspaceId } from "@/lib/db/queries/workspace-lists";
import { INVALID_INVITE_QUERY, isInvalidInvite } from "./invite-notice";

export const metadata = {
  title: "Dashboard",
  description: "Your workspaces",
};

export const instant = false;

type DashboardPageProps = {
  searchParams: Promise<{ invite?: string | string[] }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { invite } = await searchParams;
  // Forward the flag so the destination can explain the failed invite.
  const query = isInvalidInvite(invite) ? INVALID_INVITE_QUERY : "";
  const workspaceId = await getDefaultWorkspaceId(user.id);

  if (!workspaceId) {
    redirect(`/dashboard/new-workspace${query}`);
  }

  redirect(`/dashboard/${workspaceId}${query}`);
}
