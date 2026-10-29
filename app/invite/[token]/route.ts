import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { acceptWorkspaceInvite } from "@/lib/db/actions/workspace-members";
import { InviteError } from "@/lib/db/data/mutation-auth";

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

  let workspaceId: string;

  try {
    ({ workspaceId } = await acceptWorkspaceInvite(token));
  } catch (error) {
    const reason = error instanceof InviteError ? error.reason : "invalid";
    redirect(`/dashboard?invite=${reason}`);
  }

  redirect(`/dashboard/${workspaceId}`);
}
