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

export function mapLegacyFoldersAndFilesToDocuments(
  folders: LegacyFolderRow[],
  files: LegacyFileRow[],
  fallbackTimestamp: string,
): DocumentRecord[] {
  const documents: DocumentRecord[] = [];

  for (const folder of folders) {
    if (!folder.workspaceId) continue;
    const createdAt = folder.createdAt ?? fallbackTimestamp;
    documents.push({
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
    });
  }

  for (const file of files) {
    if (!file.workspaceId) continue;
    const createdAt = file.createdAt ?? fallbackTimestamp;
    documents.push({
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
    });
  }

  return documents;
}

export function legacyDocumentMigrationStatements(
  folders: LegacyFolderRow[],
  files: LegacyFileRow[],
  fallbackTimestamp: string,
): string[] {
  const documents = mapLegacyFoldersAndFilesToDocuments(
    folders,
    files,
    fallbackTimestamp,
  );

  return documents.map((document) => {
    const parentSql =
      document.parentId ? `'${document.parentId}'` : "NULL";
    const bannerSql =
      document.bannerUrl ? `'${escapeSql(document.bannerUrl)}'` : "NULL";
    const contentSql =
      document.content ? `'${escapeSql(document.content)}'` : "NULL";

    return `INSERT INTO "lipi_documents" ("id", "workspace_id", "parent_id", "title", "icon", "banner_url", "content", "in_trash", "created_at", "updated_at") VALUES ('${document.id}', '${document.workspaceId}', ${parentSql}, '${escapeSql(document.title)}', '${escapeSql(document.icon)}', ${bannerSql}, ${contentSql}, ${document.inTrash}, '${document.createdAt}', '${document.updatedAt}');`;
  });
}

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}
