import { describe, expect, it } from "vitest";

import type { DocumentRecord } from "./documents-tree";
import type { DocumentSummary } from "@/types/db";

import {
  buildOptimisticDuplicateDocuments,
  patchDocumentsForRestore,
} from "./client-document-state";

const ts = "2026-01-01T00:00:00.000Z";

function record(
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

function doc(
  partial: Partial<DocumentSummary> & Pick<DocumentSummary, "id" | "title">
): DocumentSummary {
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

describe("patchDocumentsForRestore", () => {
  it("restores trashed ancestors and descendants in client state", () => {
    const records = [
      record({ id: "root", title: "Root", inTrash: true }),
      record({ id: "child", title: "Child", parentId: "root", inTrash: true }),
      record({ id: "grand", title: "Grand", parentId: "child", inTrash: true }),
    ];
    const documents = records.map((row) => doc(row));

    const patched = patchDocumentsForRestore(documents, records, "child");

    expect(patched.every((document) => !document.inTrash)).toBe(true);
  });
});

describe("buildOptimisticDuplicateDocuments", () => {
  it("mirrors the server deep duplicate plan", () => {
    const records = [
      record({ id: "a", title: "A" }),
      record({ id: "b", title: "B", parentId: "a" }),
    ];
    const documents = records.map((row) => doc(row));

    let n = 0;
    const copies = buildOptimisticDuplicateDocuments(
      documents,
      records,
      "a",
      "copy-a",
      () => `new-${++n}`,
      "ws-1"
    );

    expect(copies).toHaveLength(2);
    expect(copies.find((copy) => copy.id === "copy-a")?.title).toBe("A copy");
    expect(copies.find((copy) => copy.parentId === "copy-a")?.title).toBe("B");
  });
});
