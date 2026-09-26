import { describe, expect, it } from "vitest";

import type { DocumentTreeNode } from "./documents-tree";
import {
  flattenVisibleTreeNodes,
  resolveTreeKeyAction,
} from "./document-tree-navigation";

function node(
  id: string,
  children: DocumentTreeNode[] = [],
  parentId: string | null = null,
): DocumentTreeNode {
  return {
    id,
    workspaceId: "ws",
    parentId,
    title: id,
    icon: "",
    bannerUrl: null,
    content: null,
    inTrash: false,
    createdAt: "",
    updatedAt: "",
    children,
  };
}

describe("flattenVisibleTreeNodes", () => {
  it("hides collapsed descendants", () => {
    const forest = [node("a", [node("b", [], "a")])];
    expect(flattenVisibleTreeNodes(forest, new Set()).map((n) => n.id)).toEqual([
      "a",
    ]);
    expect(
      flattenVisibleTreeNodes(forest, new Set(["a"])).map((n) => n.id),
    ).toEqual(["a", "b"]);
  });
});

describe("resolveTreeKeyAction", () => {
  const forest = [
    node("a", [node("b", [node("c", [], "b")], "a")]),
    node("d"),
  ];
  const expanded = new Set(["a", "b"]);
  const visible = flattenVisibleTreeNodes(forest, expanded);

  it("moves focus on arrow down", () => {
    expect(
      resolveTreeKeyAction("ArrowDown", "a", visible, expanded).nextFocusId,
    ).toBe("b");
  });

  it("expands a closed branch on arrow right", () => {
    const collapsed = flattenVisibleTreeNodes(forest, new Set());
    expect(
      resolveTreeKeyAction("ArrowRight", "a", collapsed, new Set()).expandId,
    ).toBe("a");
  });

  it("collapses an open branch on arrow left", () => {
    expect(
      resolveTreeKeyAction("ArrowLeft", "a", visible, expanded).collapseId,
    ).toBe("a");
  });
});
