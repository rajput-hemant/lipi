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

  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
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
  const walk = (parentId: string) => {
    for (const child of byParent.get(parentId) ?? []) {
      ids.push(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return ids;
}
