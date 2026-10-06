import { describe, expect, it } from "vitest";

import type { DocumentRecord } from "./documents-tree";

import { PlanQuotaError } from "@/lib/billing/errors";
import {
  assertPermanentDeleteAllowed,
  assertRootPageQuota,
  collectRestoreTargetIds,
  planDeepDuplicate,
  validateParentAssignment,
} from "./document-operations";

const ts = "2026-01-01T00:00:00.000Z";

function doc(
  partial: Partial<DocumentRecord> & Pick<DocumentRecord, "id" | "title">
): DocumentRecord {
  return {
    workspaceId: "ws-1",
    parentId: null,
    icon: "",
    bannerUrl: null,
    inTrash: false,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

describe("validateParentAssignment", () => {
  const tree = [
    doc({ id: "a", title: "A" }),
    doc({ id: "b", title: "B", parentId: "a" }),
    doc({ id: "c", title: "C", parentId: "b" }),
    doc({ id: "other-ws", title: "X", workspaceId: "ws-2" }),
    doc({ id: "trashed", title: "T", parentId: "a", inTrash: true }),
  ];

  it("rejects a parent from another workspace", () => {
    expect(() =>
      validateParentAssignment(tree, {
        workspaceId: "ws-1",
        parentId: "other-ws",
      })
    ).toThrow(/another workspace/);
  });

  it("rejects a trashed parent", () => {
    expect(() =>
      validateParentAssignment(tree, {
        workspaceId: "ws-1",
        parentId: "trashed",
      })
    ).toThrow(/trash/);
  });

  it("rejects moving under a descendant", () => {
    expect(() =>
      validateParentAssignment(tree, {
        workspaceId: "ws-1",
        parentId: "c",
        documentId: "a",
      })
    ).toThrow(/descendant/);
  });
});

describe("assertRootPageQuota", () => {
  it("blocks a fourth root page without subscription", () => {
    const documents = [
      doc({ id: "1", title: "1" }),
      doc({ id: "2", title: "2" }),
      doc({ id: "3", title: "3" }),
    ];

    expect(() => assertRootPageQuota(documents, "ws-1", false, null)).toThrow(
      PlanQuotaError
    );
  });
});

describe("collectRestoreTargetIds", () => {
  it("restores trashed ancestors and trashed descendants", () => {
    const documents = [
      doc({ id: "root", title: "Root", inTrash: true }),
      doc({ id: "child", title: "Child", parentId: "root", inTrash: true }),
      doc({ id: "grand", title: "Grand", parentId: "child", inTrash: true }),
    ];

    expect(collectRestoreTargetIds(documents, "child").sort()).toEqual([
      "child",
      "grand",
      "root",
    ]);
  });
});

describe("assertPermanentDeleteAllowed", () => {
  it("rejects when an active descendant exists", () => {
    const documents = [
      doc({ id: "a", title: "A", inTrash: true }),
      doc({ id: "b", title: "B", parentId: "a", inTrash: false }),
    ];

    expect(() => assertPermanentDeleteAllowed(documents, "a")).toThrow(
      /active descendants/
    );
  });

  it("returns trashed subtree ids when allowed", () => {
    const documents = [
      doc({ id: "a", title: "A", inTrash: true }),
      doc({ id: "b", title: "B", parentId: "a", inTrash: true }),
    ];

    expect(assertPermanentDeleteAllowed(documents, "a").sort()).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("planDeepDuplicate", () => {
  it("duplicates the full subtree with new ids", () => {
    const documents = [
      doc({ id: "a", title: "A" }),
      doc({ id: "b", title: "B", parentId: "a" }),
    ];

    let n = 0;
    const plan = planDeepDuplicate(
      documents,
      "a",
      "copy-a",
      () => `new-${++n}`
    );

    expect(plan).toHaveLength(2);
    expect(plan[0]).toMatchObject({
      id: "copy-a",
      parentId: null,
      title: "A copy",
    });
    expect(plan[1]).toMatchObject({
      id: "new-1",
      parentId: "copy-a",
      title: "B",
    });
  });
});
