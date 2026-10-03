"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { validate as validateUuid } from "uuid";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import {
  createSearchSnippet,
  escapeLikePattern,
  extractPlainTextFromDocumentContent,
} from "@/lib/search/search-utils";
import {
  requireAuthenticatedUser,
  requireWorkspacePermission,
} from "./mutation-auth";

export type SearchDocumentResult = {
  id: string;
  workspaceId: string;
  title: string;
  icon: string;
  snippet?: string;
  updatedAt: string;
};

export async function searchDocumentsInWorkspace(
  workspaceId: string,
  query: string
): Promise<SearchDocumentResult[]> {
  if (!validateUuid(workspaceId)) {
    throw new Error("Invalid workspace ID");
  }

  const user = await requireAuthenticatedUser();
  await requireWorkspacePermission(user.id, workspaceId, "document:read");

  const trimmed = query.trim();

  if (!trimmed) {
    const rows = await db
      .select({
        id: documents.id,
        workspaceId: documents.workspaceId,
        title: documents.title,
        icon: documents.icon,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.workspaceId, workspaceId),
          eq(documents.inTrash, false)
        )
      )
      .orderBy(desc(documents.updatedAt))
      .limit(10);

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      icon: row.icon,
      updatedAt: row.updatedAt,
    }));
  }

  const pattern = `%${escapeLikePattern(trimmed)}%`;
  const rows = await db
    .select({
      id: documents.id,
      workspaceId: documents.workspaceId,
      title: documents.title,
      icon: documents.icon,
      content: documents.content,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        eq(documents.inTrash, false),
        or(ilike(documents.title, pattern), ilike(documents.content, pattern))
      )
    )
    .orderBy(desc(documents.updatedAt))
    .limit(20);

  return rows.map((row) => {
    const plainText = extractPlainTextFromDocumentContent(row.content);
    const snippet = createSearchSnippet(plainText, trimmed);
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      icon: row.icon,
      snippet,
      updatedAt: row.updatedAt,
    };
  });
}
