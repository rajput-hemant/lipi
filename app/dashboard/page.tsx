import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkspaceSetup } from "./components/workspace-setup";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.id, user.id),
  });

  if (!workspace) {
    return <WorkspaceSetup />;
  }

  redirect(`/dashboard/${workspace.id}`);
}
