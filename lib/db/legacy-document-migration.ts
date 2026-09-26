import { validate as isUuid } from "uuid";

import type { DocumentRecord } from "./documents-tree";

export type LegacyFolderRow = {
  id: string;
  title: string;
  iconId: string;
  data: string | null;
  bannerUrl: string | null;
  workspaceId: string | null;
  inTrash: boolean;
  createdAt: string | null;
};

export type LegacyFileRow = LegacyFolderRow & {
  folderId: string | null;
};

export class LegacyMigrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LegacyMigrationValidationError";
  }
}

function assertMigrationUuid(value: string, field: string) {
  if (!isUuid(value)) {
    throw new LegacyMigrationValidationError(`Invalid ${field} UUID`);
  }
}

export function assertLegacyDocumentRow(row: DocumentRecord) {
  assertMigrationUuid(row.id, "document id");
  assertMigrationUuid(row.workspaceId, "workspace id");
  if (row.parentId) assertMigrationUuid(row.parentId, "parent id");
}

export function mapLegacyFoldersAndFilesToDocuments(
  folders: LegacyFolderRow[],
  files: LegacyFileRow[],
  fallbackTimestamp: string,
): DocumentRecord[] {
  const documents: DocumentRecord[] = [];

  for (const folder of folders) {
    if (!folder.workspaceId) continue;
    const createdAt = folder.createdAt ?? fallbackTimestamp;
    const row: DocumentRecord = {
      id: folder.id,
      workspaceId: folder.workspaceId,
      parentId: null,
      title: folder.title,
      icon: folder.iconId ?? "",
      bannerUrl: folder.bannerUrl,
      content: folder.data,
      inTrash: folder.inTrash,
      createdAt,
      updatedAt: createdAt,
    };
    assertLegacyDocumentRow(row);
    documents.push(row);
  }

  for (const file of files) {
    if (!file.workspaceId) continue;
    const createdAt = file.createdAt ?? fallbackTimestamp;
    const row: DocumentRecord = {
      id: file.id,
      workspaceId: file.workspaceId,
      parentId: file.folderId,
      title: file.title,
      icon: file.iconId ?? "",
      bannerUrl: file.bannerUrl,
      content: file.data,
      inTrash: file.inTrash,
      createdAt,
      updatedAt: createdAt,
    };
    assertLegacyDocumentRow(row);
    documents.push(row);
  }

  return documents;
}

/** Rows ready for Drizzle `db.insert(documents).values(rows)` (no string SQL). */
export function legacyDocumentMigrationRows(
  folders: LegacyFolderRow[],
  files: LegacyFileRow[],
  fallbackTimestamp: string,
): DocumentRecord[] {
  return mapLegacyFoldersAndFilesToDocuments(folders, files, fallbackTimestamp);
}
