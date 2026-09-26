import { describe, expect, it } from "vitest";

import {
  legacyDocumentMigrationRows,
  LegacyMigrationValidationError,
  mapLegacyFoldersAndFilesToDocuments,
} from "./legacy-document-migration";

const ws = "11111111-1111-4111-8111-111111111111";
const folderId = "22222222-2222-4222-8222-222222222222";
const fileId = "33333333-3333-4333-8333-333333333333";
const ts = "2026-01-01T00:00:00.000Z";

describe("mapLegacyFoldersAndFilesToDocuments", () => {
  it("maps folders to root documents and files under folder parents", () => {
    const documents = mapLegacyFoldersAndFilesToDocuments(
      [
        {
          id: folderId,
          title: "Notes",
          iconId: "📁",
          data: null,
          bannerUrl: null,
          workspaceId: ws,
          inTrash: false,
          createdAt: ts,
        },
      ],
      [
        {
          id: fileId,
          title: "Page",
          iconId: "📄",
          data: "body",
          bannerUrl: null,
          workspaceId: ws,
          folderId,
          inTrash: false,
          createdAt: ts,
        },
      ],
      ts,
    );

    expect(documents).toHaveLength(2);
    expect(documents.find((d) => d.id === folderId)?.parentId).toBeNull();
    expect(documents.find((d) => d.id === fileId)).toMatchObject({
      parentId: folderId,
      content: "body",
      icon: "📄",
    });
  });

  it("rejects invalid ids instead of emitting SQL", () => {
    expect(() =>
      mapLegacyFoldersAndFilesToDocuments(
        [
          {
            id: "not-a-uuid",
            title: "x",
            iconId: "",
            data: null,
            bannerUrl: null,
            workspaceId: ws,
            inTrash: false,
            createdAt: ts,
          },
        ],
        [],
        ts,
      ),
    ).toThrow(LegacyMigrationValidationError);
  });
});

describe("legacyDocumentMigrationRows", () => {
  it("returns validated insert rows", () => {
    const rows = legacyDocumentMigrationRows(
      [
        {
          id: folderId,
          title: "Notes",
          iconId: "",
          data: null,
          bannerUrl: null,
          workspaceId: ws,
          inTrash: false,
          createdAt: ts,
        },
      ],
      [],
      ts,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Notes");
  });
});
