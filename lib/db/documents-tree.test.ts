import { describe, expect, it } from "vitest";

import type { DocumentRecord } from "./documents-tree";

import {
  buildDocumentTree,
  collectDescendantIds,
  getDocumentAncestors,
} from "./documents-tree";

const ts = "2026-01-01T00:00:00.000Z";

function doc(
  partial: Partial<DocumentRecord> & Pick<DocumentRecord, "id" | "title">
): DocumentRecord {
  return {
    workspaceId: "ws-1",
    parentId: null,
    icon: "",
    bannerUrl: null,
    content: null,
    inTrash: false,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

describe("buildDocumentTree", () => {
  it("nests documents under their parent", () => {
    const flat = [
      doc({ id: "a", title: "A" }),
      doc({ id: "b", title: "B", parentId: "a" }),
      doc({ id: "c", title: "C", parentId: "b" }),
    ];

    const tree = buildDocumentTree(flat);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("a");
    expect(tree[0]?.children[0]?.id).toBe("b");
    expect(tree[0]?.children[0]?.children[0]?.id).toBe("c");
  });
});

describe("getDocumentAncestors", () => {
  it("returns root-to-parent chain", () => {
    const flat = [
      doc({ id: "a", title: "A" }),
      doc({ id: "b", title: "B", parentId: "a" }),
      doc({ id: "c", title: "C", parentId: "b" }),
    ];

    expect(getDocumentAncestors(flat, "c").map((d) => d.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("getDocumentAncestors", () => {
  it("stops on a cycle instead of looping forever", () => {
    const cyclic = [
      doc({ id: "a", title: "A", parentId: "c" }),
      doc({ id: "b", title: "B", parentId: "a" }),
      doc({ id: "c", title: "C", parentId: "b" }),
    ];

    expect(getDocumentAncestors(cyclic, "a").length).toBeLessThan(3);
  });
});

describe("collectDescendantIds", () => {
  it("includes all nested children", () => {
    const flat = [
      doc({ id: "a", title: "A" }),
      doc({ id: "b", title: "B", parentId: "a" }),
      doc({ id: "c", title: "C", parentId: "b" }),
      doc({ id: "d", title: "D" }),
    ];

    expect(collectDescendantIds(flat, "a").sort()).toEqual(["b", "c"]);
  });

  it("stops on a cycle", () => {
    const cyclic = [
      doc({ id: "a", title: "A", parentId: "c" }),
      doc({ id: "b", title: "B", parentId: "a" }),
      doc({ id: "c", title: "C", parentId: "b" }),
    ];

    expect(collectDescendantIds(cyclic, "a").length).toBeLessThan(3);
  });
});
