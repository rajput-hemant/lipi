import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "Dashboard",
  description: "Your workspaces",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.workspaceOwnerId, user.id),
  });

  if (!workspace) {
    redirect(`/dashboard/new-workspace`);
  }

  redirect(`/dashboard/${workspace.id}`);
}
