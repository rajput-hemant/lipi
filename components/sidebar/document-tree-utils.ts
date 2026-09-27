import type { DocumentRecord, DocumentTreeNode } from "@/lib/db/documents-tree";
import type { Document } from "@/types/db";

import { buildDocumentTree } from "@/lib/db/documents-tree";

export function getActiveDocuments(documents: readonly Document[]) {
  return documents.filter((document) => !document.inTrash);
}

function toDocumentRecord(document: Document): DocumentRecord | null {
  if (!document.id) return null;

  return {
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
  };
}

export function toDocumentRecords(
  documents: readonly Document[]
): DocumentRecord[] {
  const seen = new Set<string>();

  return getActiveDocuments(documents).flatMap((document) => {
    if (seen.has(document.id)) return [];
    seen.add(document.id);

    const record = toDocumentRecord(document);
    return record ? [record] : [];
  });
}

/** Includes trashed rows; use for trash restore/delete helpers, not sidebar tree building. */
export function toAllDocumentRecords(
  documents: readonly Document[]
): DocumentRecord[] {
  return documents.flatMap((document) => {
    const record = toDocumentRecord(document);
    return record ? [record] : [];
  });
}

export function getDocumentForest(documents: readonly Document[]) {
  return buildDocumentTree(toDocumentRecords(documents));
}

export function countChildren(
  documents: readonly Document[],
  parentId: string | null
) {
  return getActiveDocuments(documents).filter(
    (document) => (document.parentId ?? null) === parentId
  ).length;
}

export type { DocumentTreeNode };
