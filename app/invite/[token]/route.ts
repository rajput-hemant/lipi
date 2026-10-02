import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { acceptWorkspaceInvite } from "@/lib/db/queries";

type InviteRouteContext = {
  params: Promise<{ token: string }>;
};

// A route handler, not a page: accepting revalidates workspace tags, which
// Next.js forbids during render.
export async function GET(_request: Request, { params }: InviteRouteContext) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?from=${encodeURIComponent(`/invite/${token}`)}`);
  }

  let workspaceId: string | null;

  try {
    ({ workspaceId } = await acceptWorkspaceInvite(token));
  } catch {
    workspaceId = null;
  }

  if (!workspaceId) redirect("/dashboard?invite=invalid");
  redirect(`/dashboard/${workspaceId}`);
}
