import { notFound, redirect } from "next/navigation";

import { DocumentPageView } from "@/components/document-editor/document-page-view";
import { getCurrentUser } from "@/lib/auth";
import { assertDocumentAccess } from "@/lib/db/queries/mutation-auth";

type FilePageProps = {
  params: Promise<{ workspaceId: string; fileId: string }>;
};

export default async function FilePage({ params }: FilePageProps) {
  const { workspaceId, fileId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let document;
  try {
    document = await assertDocumentAccess(user.id, fileId);
  } catch {
    notFound();
  }

  if (document.workspaceId !== workspaceId) {
    notFound();
  }

  return <DocumentPageView document={document} />;
}
