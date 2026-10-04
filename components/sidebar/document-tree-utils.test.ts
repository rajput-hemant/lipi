import { describe, expect, it } from "vitest";

import type { DocumentSummary } from "@/types/db";

import { assertPermanentDeleteAllowed } from "@/lib/db/document-operations";
import { toAllDocumentRecords, toDocumentRecords } from "./document-tree-utils";

const ts = "2026-01-01T00:00:00.000Z";

function trashedDoc(
  id: string,
  parentId: string | null = null
): DocumentSummary {
  return {
    id,
    workspaceId: "ws-1",
    parentId,
    title: id,
    icon: "",
    bannerUrl: null,
    inTrash: true,
    createdAt: ts,
    updatedAt: ts,
  };
}

describe("trash record helpers", () => {
  it("drops trashed rows from toDocumentRecords", () => {
    expect(toDocumentRecords([trashedDoc("a")])).toHaveLength(0);
  });

  it("resolves permanent delete ids when using toAllDocumentRecords", () => {
    const documents = [trashedDoc("a"), trashedDoc("b", "a")];

    expect(() =>
      assertPermanentDeleteAllowed(toDocumentRecords(documents), "a")
    ).toThrow(/not found/i);

    expect(
      assertPermanentDeleteAllowed(toAllDocumentRecords(documents), "a").sort()
    ).toEqual(["a", "b"]);
  });
});
