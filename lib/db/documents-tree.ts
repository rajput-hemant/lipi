export type DocumentRecord = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string;
  bannerUrl: string | null;
  content: string | null;
  inTrash: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocumentTreeNode = DocumentRecord & {
  children: DocumentTreeNode[];
};

export function buildDocumentTree(
  documents: DocumentRecord[],
): DocumentTreeNode[] {
  const byParent = new Map<string | null, DocumentRecord[]>();

  for (const document of documents) {
    const parentKey = document.parentId ?? null;
    const siblings = byParent.get(parentKey);
    if (siblings) {
      siblings.push(document);
    } else {
      byParent.set(parentKey, [document]);
    }
  }

  const build = (parentId: string | null): DocumentTreeNode[] =>
    (byParent.get(parentId) ?? []).map((document) => ({
      ...document,
      children: build(document.id),
    }));

  return build(null);
}

export function getDocumentAncestors(
  documents: DocumentRecord[],
  documentId: string,
): DocumentRecord[] {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const ancestors: DocumentRecord[] = [];
  let current = byId.get(documentId);

  const visited = new Set<string>();

  while (current?.parentId) {
    if (visited.has(current.parentId)) break;

    const parent = byId.get(current.parentId);
    if (!parent || parent.id === documentId) break;

    visited.add(current.parentId);
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

export function collectDescendantIds(
  documents: DocumentRecord[],
  rootId: string,
): string[] {
  const byParent = new Map<string | null, DocumentRecord[]>();
  for (const document of documents) {
    const parentKey = document.parentId ?? null;
    const siblings = byParent.get(parentKey);
    if (siblings) {
      siblings.push(document);
    } else {
      byParent.set(parentKey, [document]);
    }
  }

  const ids: string[] = [];
  const visited = new Set<string>([rootId]);

  const walk = (parentId: string) => {
    for (const child of byParent.get(parentId) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      ids.push(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return ids;
}
