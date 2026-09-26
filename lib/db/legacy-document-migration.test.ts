import { describe, expect, it } from "vitest";

import {
  legacyDocumentMigrationStatements,
  mapLegacyFoldersAndFilesToDocuments,
} from "./legacy-document-migration";

const ts = "2026-01-01T00:00:00.000Z";

describe("mapLegacyFoldersAndFilesToDocuments", () => {
  it("maps folders to root documents and files under folder parents", () => {
    const documents = mapLegacyFoldersAndFilesToDocuments(
      [
        {
          id: "folder-1",
          title: "Notes",
          iconId: "📁",
          data: null,
          bannerUrl: null,
          workspaceId: "ws-1",
          inTrash: false,
          createdAt: ts,
        },
      ],
      [
        {
          id: "file-1",
          title: "Page",
          iconId: "📄",
          data: "body",
          bannerUrl: null,
          workspaceId: "ws-1",
          folderId: "folder-1",
          inTrash: false,
          createdAt: ts,
        },
      ],
      ts,
    );

    expect(documents).toHaveLength(2);
    expect(documents.find((d) => d.id === "folder-1")?.parentId).toBeNull();
    expect(documents.find((d) => d.id === "file-1")).toMatchObject({
      parentId: "folder-1",
      content: "body",
      icon: "📄",
    });
  });
});

describe("legacyDocumentMigrationStatements", () => {
  it("emits insert statements for migrated rows", () => {
    const statements = legacyDocumentMigrationStatements(
      [
        {
          id: "folder-1",
          title: "Notes",
          iconId: "",
          data: null,
          bannerUrl: null,
          workspaceId: "ws-1",
          inTrash: false,
          createdAt: ts,
        },
      ],
      [],
      ts,
    );

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain('INSERT INTO "lipi_documents"');
    expect(statements[0]).toContain("'folder-1'");
  });
});
