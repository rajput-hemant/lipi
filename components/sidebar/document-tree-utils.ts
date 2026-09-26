import type { Document } from "@/types/db";

import {
  buildDocumentTree,
  type DocumentRecord,
  type DocumentTreeNode,
} from "@/lib/db/documents-tree";

export function getActiveDocuments(documents: readonly Document[]) {
  return documents.filter((document) => !document.inTrash);
}

export function toDocumentRecords(documents: readonly Document[]): DocumentRecord[] {
  return getActiveDocuments(documents).flatMap((document) =>
    document.id ?
      [
        {
          id: document.id,
          workspaceId: document.workspaceId,
          parentId: document.parentId ?? null,
          title: document.title,
          icon: document.icon ?? "",
          bannerUrl: document.bannerUrl ?? null,
          content: document.content ?? null,
          inTrash: document.inTrash ?? false,
          createdAt: document.createdAt ?? new Date(0).toISOString(),
          updatedAt: document.updatedAt ?? new Date(0).toISOString(),
        },
      ]
    : [],
  );
}

export function getDocumentForest(documents: readonly Document[]) {
  return buildDocumentTree(toDocumentRecords(documents));
}

export function countChildren(
  documents: readonly Document[],
  parentId: string | null,
) {
  return getActiveDocuments(documents).filter(
    (document) => (document.parentId ?? null) === parentId,
  ).length;
}

export type { DocumentTreeNode };
