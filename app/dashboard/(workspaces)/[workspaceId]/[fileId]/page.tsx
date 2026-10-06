import { notFound, redirect } from "next/navigation";

import type { Metadata } from "next";

import { DocumentPageView } from "@/components/document-editor/document-page-view";
import { getCurrentUser } from "@/lib/auth";
import { assertDocumentAccess } from "@/lib/db/data/mutation-auth";

type FilePageProps = {
  params: Promise<{ workspaceId: string; fileId: string }>;
};

export const instant = false;

export async function generateMetadata({
  params,
}: FilePageProps): Promise<Metadata> {
  const { workspaceId, fileId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Document" };

  try {
    const document = await assertDocumentAccess(user.id, fileId);
    if (document.workspaceId !== workspaceId || document.inTrash) {
      return { title: "Document" };
    }
    return {
      title: document.title || "Untitled Document",
    };
  } catch {
    return { title: "Document" };
  }
}

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

  if (document.workspaceId !== workspaceId || document.inTrash) {
    notFound();
  }

  return <DocumentPageView document={document} />;
}
