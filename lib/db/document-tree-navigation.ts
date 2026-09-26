import type { DocumentTreeNode } from "./documents-tree";

export type VisibleTreeNode = {
  id: string;
  depth: number;
  parentId: string | null;
  hasChildren: boolean;
};

export function flattenVisibleTreeNodes(
  forest: DocumentTreeNode[],
  expandedIds: Set<string>
): VisibleTreeNode[] {
  const visible: VisibleTreeNode[] = [];

  const walk = (nodes: DocumentTreeNode[], depth: number) => {
    for (const node of nodes) {
      const hasChildren = node.children.length > 0;
      visible.push({
        id: node.id,
        depth,
        parentId: node.parentId,
        hasChildren,
      });

      if (hasChildren && expandedIds.has(node.id)) {
        walk(node.children, depth + 1);
      }
    }
  };

  walk(forest, 0);
  return visible;
}

export type TreeKeyAction = {
  nextFocusId?: string;
  expandId?: string;
  collapseId?: string;
};

export function resolveTreeKeyAction(
  key: string,
  focusedId: string | null,
  visible: VisibleTreeNode[],
  expandedIds: Set<string>
): TreeKeyAction {
  if (!visible.length) return {};

  const index =
    focusedId ? visible.findIndex((node) => node.id === focusedId) : -1;
  const current = index >= 0 ? visible[index] : visible[0];

  switch (key) {
    case "ArrowDown": {
      if (index < 0) return { nextFocusId: visible[0].id };
      if (index < visible.length - 1) {
        return { nextFocusId: visible[index + 1].id };
      }
      return {};
    }
    case "ArrowUp": {
      if (index > 0) return { nextFocusId: visible[index - 1].id };
      return {};
    }
    case "Home":
      return { nextFocusId: visible[0].id };
    case "End":
      return { nextFocusId: visible[visible.length - 1].id };
    case "ArrowRight": {
      if (!current.hasChildren) return {};
      if (!expandedIds.has(current.id)) return { expandId: current.id };
      if (index >= 0 && index < visible.length - 1) {
        return { nextFocusId: visible[index + 1].id };
      }
      return {};
    }
    case "ArrowLeft": {
      if (current.hasChildren && expandedIds.has(current.id)) {
        return { collapseId: current.id };
      }
      if (current.parentId) {
        return { nextFocusId: current.parentId };
      }
      return {};
    }
    default:
      return {};
  }
}
