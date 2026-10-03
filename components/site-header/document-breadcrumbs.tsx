"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { toDocumentRecords } from "@/components/sidebar/document-tree-utils";
import { useAppState } from "@/hooks/use-app-state";
import { getDocumentAncestors } from "@/lib/db/documents-tree";

export function DocumentBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const workspaceId = segments[1];
  const documentId = segments[2];
  const { documents, workspace } = useAppState();
  const workspaceTitle = workspace?.title || "Workspace";

  if (!workspaceId || !documentId) {
    return (
      <nav
        aria-label="Breadcrumb"
        className="ml-4 truncate text-sm font-medium text-muted-foreground"
      >
        {workspaceTitle}
      </nav>
    );
  }

  const activeDocuments = documents.filter((document) => !document.inTrash);
  const current = activeDocuments.find(
    (document) => document.id === documentId
  );

  if (!current) {
    return null;
  }

  const ancestors = getDocumentAncestors(
    toDocumentRecords(activeDocuments),
    documentId
  );
  const chain = [...ancestors, current];

  return (
    <nav
      aria-label="Breadcrumb"
      className="ml-4 flex min-w-0 items-center gap-1 text-sm"
    >
      <Link
        href={`/dashboard/${workspaceId}`}
        className="truncate text-muted-foreground hover:text-foreground"
      >
        {workspaceTitle}
      </Link>
      {chain.map((document) => (
        <span key={document.id} className="flex min-w-0 items-center gap-1">
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <Link
            href={`/dashboard/${workspaceId}/${document.id}`}
            className="truncate font-medium hover:underline"
            aria-current={document.id === documentId ? "page" : undefined}
          >
            {document.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
