import type { DocumentRecord } from "./documents-tree";

import { collectDescendantIds } from "./documents-tree";

export class DocumentOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentOperationError";
  }
}

export const FREE_WORKSPACE_ROOT_PAGE_LIMIT = 3;

export function validateParentAssignment(
  documents: DocumentRecord[],
  options: {
    workspaceId: string;
    parentId: string | null | undefined;
    documentId?: string;
  }
) {
  const { workspaceId, parentId, documentId } = options;

  if (!parentId) return;

  if (documentId && parentId === documentId) {
    throw new DocumentOperationError("A document cannot be its own parent");
  }

  const byId = new Map(documents.map((document) => [document.id, document]));
  const parent = byId.get(parentId);

  if (!parent) {
    throw new DocumentOperationError("Parent document not found");
  }

  if (parent.workspaceId !== workspaceId) {
    throw new DocumentOperationError("Parent belongs to another workspace");
  }

  if (parent.inTrash) {
    throw new DocumentOperationError("Parent is in trash");
  }

  if (documentId) {
    const descendants = new Set(collectDescendantIds(documents, documentId));
    if (descendants.has(parentId)) {
      throw new DocumentOperationError(
        "Cannot move a document under its descendant"
      );
    }
  }
}

export function countActiveRootPages(
  documents: DocumentRecord[],
  workspaceId: string
) {
  return documents.filter(
    (document) =>
      document.workspaceId === workspaceId &&
      !document.inTrash &&
      (document.parentId ?? null) === null
  ).length;
}

export function assertRootPageQuota(
  documents: DocumentRecord[],
  workspaceId: string,
  hasActiveSubscription: boolean,
  parentId: string | null | undefined
) {
  if (parentId || hasActiveSubscription) return;

  if (
    countActiveRootPages(documents, workspaceId) >=
    FREE_WORKSPACE_ROOT_PAGE_LIMIT
  ) {
    throw new DocumentOperationError("Root page limit reached");
  }
}

export function collectTrashedAncestorIds(
  documents: DocumentRecord[],
  documentId: string
): string[] {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const ids: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(documentId);

  while (current?.parentId) {
    if (visited.has(current.parentId)) break;
    visited.add(current.parentId);

    const parent = byId.get(current.parentId);
    if (!parent) break;
    if (parent.inTrash) ids.unshift(parent.id);
    current = parent;
  }

  return ids;
}

export function collectRestoreTargetIds(
  documents: DocumentRecord[],
  documentId: string
): string[] {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const trashedAncestors = collectTrashedAncestorIds(documents, documentId);
  const trashedDescendants = collectDescendantIds(documents, documentId).filter(
    (id) => byId.get(id)?.inTrash
  );

  return [...new Set([...trashedAncestors, documentId, ...trashedDescendants])];
}

export function assertPermanentDeleteAllowed(
  documents: DocumentRecord[],
  documentId: string
) {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const root = byId.get(documentId);
  if (!root) {
    throw new DocumentOperationError("Document not found");
  }

  if (!root.inTrash) {
    throw new DocumentOperationError(
      "Only trashed documents can be deleted permanently"
    );
  }

  const subtreeIds = [
    documentId,
    ...collectDescendantIds(documents, documentId),
  ];
  for (const id of subtreeIds) {
    const row = byId.get(id);
    if (row && !row.inTrash) {
      throw new DocumentOperationError(
        "Cannot permanently delete a document with active descendants"
      );
    }
  }

  return subtreeIds.filter((id) => byId.get(id)?.inTrash);
}

export type DuplicateNode = {
  id: string;
  sourceId: string;
  parentId: string | null;
  title: string;
  icon: string;
  bannerUrl: string | null;
};

export function planDeepDuplicate(
  documents: DocumentRecord[],
  sourceRootId: string,
  newRootId: string,
  createId: () => string
): DuplicateNode[] {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const source = byId.get(sourceRootId);
  if (!source) {
    throw new DocumentOperationError("Source document not found");
  }

  const idMap = new Map<string, string>([[sourceRootId, newRootId]]);
  const ordered: DocumentRecord[] = [source];
  const queue = [sourceRootId];

  while (queue.length) {
    const parentId = queue.shift()!;
    for (const document of documents) {
      if (document.parentId === parentId && !idMap.has(document.id)) {
        idMap.set(document.id, createId());
        ordered.push(document);
        queue.push(document.id);
      }
    }
  }

  return ordered.map((document) => {
    const newId = idMap.get(document.id)!;
    const mappedParent =
      document.parentId ? (idMap.get(document.parentId) ?? null) : null;

    return {
      id: newId,
      sourceId: document.id,
      parentId: mappedParent,
      title:
        document.id === sourceRootId ?
          `${document.title} copy`
        : document.title,
      icon: document.icon,
      bannerUrl: document.bannerUrl,
    };
  });
}
