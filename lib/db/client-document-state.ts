import type { DocumentRecord } from "./documents-tree";
import type { DocumentSummary } from "@/types/db";

import {
  assertPermanentDeleteAllowed,
  collectRestoreTargetIds,
  planDeepDuplicate,
} from "./document-operations";

export function patchDocumentsForRestore(
  documents: DocumentSummary[],
  records: DocumentRecord[],
  documentId: string
): DocumentSummary[] {
  const restoreIds = new Set(collectRestoreTargetIds(records, documentId));

  return documents.map((document) =>
    restoreIds.has(document.id) ? { ...document, inTrash: false } : document
  );
}

export function permanentDeleteTargetIds(
  records: DocumentRecord[],
  documentId: string
): string[] {
  return assertPermanentDeleteAllowed(records, documentId);
}

export function buildOptimisticDuplicateDocuments(
  documents: readonly DocumentSummary[],
  records: DocumentRecord[],
  sourceRootId: string,
  newRootId: string,
  createId: () => string,
  workspaceId: string
): DocumentSummary[] {
  const plan = planDeepDuplicate(records, sourceRootId, newRootId, createId);
  const byId = new Map(documents.map((document) => [document.id, document]));
  const now = new Date().toISOString();

  return plan.map((node) => {
    const source = byId.get(node.sourceId);
    return {
      id: node.id,
      workspaceId,
      parentId: node.parentId,
      title: node.title,
      icon: node.icon,
      bannerUrl: node.bannerUrl,
      inTrash: source?.inTrash ?? false,
      createdAt: now,
      updatedAt: now,
    };
  });
}
