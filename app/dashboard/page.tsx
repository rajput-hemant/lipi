import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getDefaultWorkspaceId } from "@/lib/db/queries";

export const metadata = {
  title: "Dashboard",
  description: "Your workspaces",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await getDefaultWorkspaceId(user.id);

  if (!workspaceId) {
    redirect(`/dashboard/new-workspace`);
  }

  redirect(`/dashboard/${workspaceId}`);
}
