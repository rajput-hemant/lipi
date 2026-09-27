import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { acceptWorkspaceInvite } from "@/lib/db/queries";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const instant = false;

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  try {
    const { workspaceId } = await acceptWorkspaceInvite(token);
    redirect(`/dashboard/${workspaceId}`);
  } catch {
    redirect("/dashboard?invite=invalid");
  }
}
