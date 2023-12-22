import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getFolders } from "@/lib/db/queries";
import { toast } from "@/hooks/use-toast";
import { ResizableLayout } from "../components/resizable-layout";

type WorkspaceLayoutProps = React.PropsWithChildren<{
  params: { workspaceId: string };
}>;

export default async function WorkspaceLayout({
  params: { workspaceId },
  children,
}: WorkspaceLayoutProps) {
  const layout = cookies().get("react-resizable-panels:layout");
  const collapsed = cookies().get("react-resizable-panels:collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { data: folders, error } = await getFolders(workspaceId);

  if (error) {
    toast({
      title: "Something went wrong",
      description: "Unable to fetch folders for this workspace.",
    });
  }

  return (
    <ResizableLayout
      user={user}
      folders={folders}
      defaultLayout={defaultLayout as number[]}
      defaultCollapsed={defaultCollapsed as boolean}
    >
      {children}
    </ResizableLayout>
  );
}
