import type { DocumentRecord, DocumentTreeNode } from "@/lib/db/documents-tree";
import type { DocumentSummary } from "@/types/db";

import { buildDocumentTree } from "@/lib/db/documents-tree";

export function getActiveDocuments(documents: readonly DocumentSummary[]) {
  return documents.filter((document) => !document.inTrash);
}

export function toDocumentRecords(
  documents: readonly DocumentSummary[]
): DocumentRecord[] {
  const seen = new Set<string>();

  return getActiveDocuments(documents).filter((document) => {
    if (seen.has(document.id)) return false;
    seen.add(document.id);
    return true;
  });
}

/** Includes trashed rows; use for trash restore/delete helpers, not sidebar tree building. */
export function toAllDocumentRecords(
  documents: readonly DocumentSummary[]
): DocumentRecord[] {
  return [...documents];
}

export function getDocumentForest(documents: readonly DocumentSummary[]) {
  return buildDocumentTree(toDocumentRecords(documents));
}

export function countChildren(
  documents: readonly DocumentSummary[],
  parentId: string | null
) {
  return getActiveDocuments(documents).filter(
    (document) => (document.parentId ?? null) === parentId
  ).length;
}

export type { DocumentTreeNode };
