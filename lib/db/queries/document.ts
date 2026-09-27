"use server";

import { unstable_cache as cache, updateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuid, validate as validateUuid } from "uuid";

import type { DocumentRecord } from "@/lib/db/documents-tree";
import type { Document } from "@/types/db";

import { userHasProPlanEntitlement } from "@/lib/billing/quota-entitlement";
import {
  assertPermanentDeleteAllowed,
  assertRootPageQuota,
  collectRestoreTargetIds,
  DocumentOperationError,
  orderPermanentDeleteIds,
  planDeepDuplicate,
  validateParentAssignment,
} from "@/lib/db/document-operations";
import { collectDescendantIds } from "@/lib/db/documents-tree";
import {
  createDocumentSchema,
  duplicateDocumentSchema,
  updateDocumentSchema,
} from "@/lib/validations/document";
import { loadAuthoritativeDocumentContentBySourceIds } from "@/lib/realtime/authoritative-content";
import { db } from "..";
import { documents } from "../schema";
import {
  assertWorkspaceAccess,
  authorizeDocumentMutation,
  authorizeWorkspaceMutation,
  MutationAuthError,
  requireAuthenticatedUser,
} from "./mutation-auth";

function documentsCacheTag(workspaceId: string) {
  return `documents_${workspaceId}`;
}

function revalidateDocuments(workspaceId: string) {
  updateTag(documentsCacheTag(workspaceId));
}

function toRecords(rows: Document[]): DocumentRecord[] {
  return rows.map((row) => ({
    id: row.id!,
    workspaceId: row.workspaceId,
    parentId: row.parentId ?? null,
    title: row.title,
    icon: row.icon ?? "",
    bannerUrl: row.bannerUrl ?? null,
    content: row.content ?? null,
    inTrash: row.inTrash ?? false,
    createdAt: row.createdAt ?? new Date(0).toISOString(),
    updatedAt: row.updatedAt ?? new Date(0).toISOString(),
  }));
}

function rethrowKnownErrors(error: unknown) {
  if (error instanceof MutationAuthError) throw error;
  if (error instanceof DocumentOperationError) {
    throw new MutationAuthError(error.message);
  }
}

async function loadWorkspaceDocuments(workspaceId: string) {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId));
  return toRecords(rows);
}

export async function createDocument(input: unknown) {
  const parsed = createDocumentSchema.parse(input);
  let workspaceIdForRevalidate: string | undefined;

  try {
    const user = await authorizeWorkspaceMutation(parsed.workspaceId);
    const workspaceDocs = await loadWorkspaceDocuments(parsed.workspaceId);
    const hasProEntitlement = await userHasProPlanEntitlement(user.id);

    assertRootPageQuota(
      workspaceDocs,
      parsed.workspaceId,
      hasProEntitlement,
      parsed.parentId ?? null
    );
    validateParentAssignment(workspaceDocs, {
      workspaceId: parsed.workspaceId,
      parentId: parsed.parentId ?? null,
    });

    const [data] = await db
      .insert(documents)
      .values({
        id: parsed.id,
        workspaceId: parsed.workspaceId,
        parentId: parsed.parentId ?? null,
        title: parsed.title,
        icon: parsed.icon ?? "",
      })
      .returning();

    workspaceIdForRevalidate = parsed.workspaceId;
    return data;
  } catch (e) {
    rethrowKnownErrors(e);
    console.error((e as Error).message);
    throw new Error("Failed to create document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export async function getDocuments(workspaceId: string) {
  if (!validateUuid(workspaceId)) {
    throw new Error("Invalid workspace ID");
  }

  return cache(
    async () => {
      try {
        const user = await requireAuthenticatedUser();
        await assertWorkspaceAccess(user.id, workspaceId);

        return await db
          .select()
          .from(documents)
          .where(eq(documents.workspaceId, workspaceId))
          .orderBy(documents.createdAt);
      } catch (e) {
        if (e instanceof MutationAuthError) throw e;
        console.error((e as Error).message);
        throw new Error("Failed to fetch documents from the database");
      }
    },
    ["get_documents", workspaceId],
    { tags: [documentsCacheTag(workspaceId)] }
  )();
}

export const getDocumentsFromDb = getDocuments;

export async function updateDocument(input: unknown) {
  const parsed = updateDocumentSchema.parse(input);
  let workspaceIdForRevalidate: string | undefined;

  try {
    if (!parsed.id) {
      throw new MutationAuthError("Invalid document");
    }

    const { document: existing } = await authorizeDocumentMutation(parsed.id);
    workspaceIdForRevalidate = existing.workspaceId;
    const workspaceDocs = await loadWorkspaceDocuments(existing.workspaceId);

    if (parsed.parentId !== undefined) {
      validateParentAssignment(workspaceDocs, {
        workspaceId: existing.workspaceId,
        parentId: parsed.parentId,
        documentId: parsed.id,
      });
    }

    const { id, ...patch } = parsed;

    const [data] = await db
      .update(documents)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();

    return data;
  } catch (e) {
    rethrowKnownErrors(e);
    console.error((e as Error).message);
    throw new Error("Failed to update document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export const updateDocumentInDb = updateDocument;

export async function softDeleteDocumentTree(documentId: string) {
  let workspaceIdForRevalidate: string | undefined;

  try {
    const { document: root } = await authorizeDocumentMutation(documentId);
    workspaceIdForRevalidate = root.workspaceId;

    const workspaceDocs = await loadWorkspaceDocuments(root.workspaceId);

    const descendantIds = collectDescendantIds(workspaceDocs, documentId);
    const ids = [documentId, ...descendantIds];

    await db
      .update(documents)
      .set({ inTrash: true, updatedAt: new Date().toISOString() })
      .where(inArray(documents.id, ids));

    return ids.length;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to move document to trash");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export async function restoreDocument(documentId: string) {
  let workspaceIdForRevalidate: string | undefined;

  try {
    const { document: existing } = await authorizeDocumentMutation(documentId);
    workspaceIdForRevalidate = existing.workspaceId;
    const workspaceDocs = await loadWorkspaceDocuments(existing.workspaceId);
    const ids = collectRestoreTargetIds(workspaceDocs, documentId);

    await db
      .update(documents)
      .set({ inTrash: false, updatedAt: new Date().toISOString() })
      .where(inArray(documents.id, ids));

    return ids.length;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to restore document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export async function deleteDocumentPermanently(documentId: string) {
  let workspaceIdForRevalidate: string | undefined;

  try {
    const { document: existing } = await authorizeDocumentMutation(documentId);
    workspaceIdForRevalidate = existing.workspaceId;
    const workspaceDocs = await loadWorkspaceDocuments(existing.workspaceId);
    const ids = assertPermanentDeleteAllowed(workspaceDocs, documentId);
    const ordered = orderPermanentDeleteIds(workspaceDocs, ids);

    for (const id of ordered) {
      await db.delete(documents).where(eq(documents.id, id));
    }

    return ids.length;
  } catch (e) {
    rethrowKnownErrors(e);
    console.error((e as Error).message);
    throw new Error("Failed to delete document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export async function duplicateDocument(input: unknown) {
  const { sourceId, newId } = duplicateDocumentSchema.parse(input);
  let workspaceIdForRevalidate: string | undefined;

  try {
    const { document: source } = await authorizeDocumentMutation(sourceId);
    workspaceIdForRevalidate = source.workspaceId;
    const workspaceDocs = await loadWorkspaceDocuments(source.workspaceId);
    const plan = planDeepDuplicate(workspaceDocs, sourceId, newId, uuid);
    const fallbackBySourceId = new Map(
      plan.map((node) => [node.sourceId, node.content])
    );
    const authoritativeContent =
      await loadAuthoritativeDocumentContentBySourceIds(
        plan.map((node) => node.sourceId),
        fallbackBySourceId
      );

    const now = new Date().toISOString();
    const rows = plan.map((node) => ({
      id: node.id,
      workspaceId: source.workspaceId,
      parentId: node.parentId,
      title: node.title,
      icon: node.icon,
      bannerUrl: node.bannerUrl,
      content: authoritativeContent.get(node.sourceId) ?? node.content,
      createdAt: now,
      updatedAt: now,
    }));

    const inserted = await db.insert(documents).values(rows).returning();

    return inserted.find((row) => row.id === newId) ?? inserted[0];
  } catch (e) {
    rethrowKnownErrors(e);
    console.error((e as Error).message);
    throw new Error("Failed to duplicate document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate);
    }
  }
}

export async function getDocumentBreadcrumbs(
  workspaceId: string,
  documentId: string
) {
  if (!validateUuid(workspaceId) || !validateUuid(documentId)) {
    return [];
  }

  const user = await requireAuthenticatedUser();
  await assertWorkspaceAccess(user.id, workspaceId);

  const rows = await getDocuments(workspaceId);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const chain: Document[] = [];
  let current = byId.get(documentId);
  const visited = new Set<string>();

  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    if (visited.has(current.parentId)) break;
    visited.add(current.parentId);
    current = byId.get(current.parentId);
  }

  return chain;
}
