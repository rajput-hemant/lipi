"use server";

import { unstable_cache as cache, revalidatePath, updateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuid, validate as validateUuid } from "uuid";

import type { DocumentRecord } from "@/lib/db/documents-tree";
import type { DocumentSummary } from "@/types/db";

import { workspaceOwnerHasProPlanEntitlement } from "@/lib/billing/quota-entitlement";
import {
  assertPermanentDeleteAllowed,
  assertRootPageQuota,
  collectRestoreTargetIds,
  DocumentOperationError,
  planDeepDuplicate,
  validateParentAssignment,
} from "@/lib/db/document-operations";
import { documentSummaryColumns } from "@/lib/db/document-summary";
import { collectDescendantIds } from "@/lib/db/documents-tree";
import { loadAuthoritativeDocumentContentBySourceIds } from "@/lib/realtime/authoritative-content";
import {
  createDocumentSchema,
  duplicateDocumentSchema,
  updateDocumentSchema,
} from "@/lib/validations/document";
import { db } from "..";
import { documents } from "../schema";
import {
  assertWorkspaceAccess,
  authorizeDocumentMutation,
  authorizeWorkspaceMutation,
  MutationAuthError,
  requireAuthenticatedUser,
} from "./mutation-auth";
import { mutationFailure } from "./mutation-failure";

// `db` is a single-connection client: inside `db.transaction`, every query
// must go through `tx` or it waits forever for the connection the transaction holds.
type DbExecutor = Pick<typeof db, "select">;

function documentsCacheTag(workspaceId: string) {
  return `documents_${workspaceId}`;
}

function revalidateDocuments(workspaceId: string, documentId?: string) {
  updateTag(documentsCacheTag(workspaceId));
  revalidatePath(`/dashboard/${workspaceId}`);
  if (documentId) {
    revalidatePath(`/dashboard/${workspaceId}/${documentId}`);
  }
}

function toRecords(rows: DocumentSummary[]): DocumentRecord[] {
  return rows.map((row) => ({
    id: row.id!,
    workspaceId: row.workspaceId,
    parentId: row.parentId ?? null,
    title: row.title,
    icon: row.icon ?? "",
    bannerUrl: row.bannerUrl ?? null,
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

function forbiddenResult(error: unknown) {
  if (error instanceof MutationAuthError && error.code === "FORBIDDEN") {
    return mutationFailure(error);
  }
}

async function loadWorkspaceDocuments(
  workspaceId: string,
  executor: DbExecutor = db
) {
  const rows = await executor
    .select(documentSummaryColumns)
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId));
  return toRecords(rows);
}

export async function createDocument(input: unknown) {
  const parsed = createDocumentSchema.parse(input);
  let workspaceIdForRevalidate: string | undefined;

  try {
    await authorizeWorkspaceMutation(parsed.workspaceId);
    const workspaceDocs = await loadWorkspaceDocuments(parsed.workspaceId);
    const hasProEntitlement = await workspaceOwnerHasProPlanEntitlement(
      parsed.workspaceId
    );

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
      .returning(documentSummaryColumns);

    workspaceIdForRevalidate = parsed.workspaceId;
    return { ok: true, data } as const;
  } catch (e) {
    const denied = forbiddenResult(e);
    if (denied) return denied;
    rethrowKnownErrors(e);
    console.error((e as Error).message);
    throw new Error("Failed to create document");
  } finally {
    if (workspaceIdForRevalidate) {
      revalidateDocuments(workspaceIdForRevalidate, parsed.id);
    }
  }
}

export async function getDocuments(workspaceId: string) {
  if (!validateUuid(workspaceId)) {
    throw new Error("Invalid workspace ID");
  }

  // Authorize on every call: the cached loader is keyed by workspace only, and
  // this exported server action must not serve cached rows to non-members.
  const user = await requireAuthenticatedUser();
  await assertWorkspaceAccess(user.id, workspaceId);

  return cache(
    async () => {
      try {
        return await db
          .select(documentSummaryColumns)
          .from(documents)
          .where(eq(documents.workspaceId, workspaceId))
          .orderBy(documents.createdAt);
      } catch (e) {
        console.error((e as Error).message);
        throw new Error("Failed to fetch documents from the database");
      }
    },
    ["get_documents", workspaceId],
    { tags: [documentsCacheTag(workspaceId)] }
  )();
}

export async function updateDocument(input: unknown) {
  const parsed = updateDocumentSchema.parse(input);
  let workspaceIdForRevalidate: string | undefined;

  try {
    if (!parsed.id) {
      throw new MutationAuthError("Invalid document");
    }

    const { document: existing } = await authorizeDocumentMutation(parsed.id);
    workspaceIdForRevalidate = existing.workspaceId;
    const movesToRoot = parsed.parentId === null && !!existing.parentId;
    const hasProEntitlement =
      movesToRoot ?
        await workspaceOwnerHasProPlanEntitlement(existing.workspaceId)
      : false;

    const { id, ...patch } = parsed;

    return await db.transaction(async (tx) => {
      const workspaceDocs = await loadWorkspaceDocuments(
        existing.workspaceId,
        tx
      );

      if (movesToRoot) {
        assertRootPageQuota(
          workspaceDocs,
          existing.workspaceId,
          hasProEntitlement,
          null
        );
      }

      if (parsed.parentId !== undefined) {
        validateParentAssignment(workspaceDocs, {
          workspaceId: existing.workspaceId,
          parentId: parsed.parentId,
          documentId: parsed.id,
        });
      }

      const [data] = await tx
        .update(documents)
        .set({ ...patch, updatedAt: new Date().toISOString() })
        .where(eq(documents.id, id))
        .returning(documentSummaryColumns);

      return data;
    });
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

export async function softDeleteDocumentTree(documentId: string) {
  let workspaceIdForRevalidate: string | undefined;

  try {
    const { document: root } = await authorizeDocumentMutation(documentId);
    workspaceIdForRevalidate = root.workspaceId;

    const count = await db.transaction(async (tx) => {
      const workspaceDocs = await loadWorkspaceDocuments(root.workspaceId, tx);
      const ids = [
        documentId,
        ...collectDescendantIds(workspaceDocs, documentId),
      ];

      await tx
        .update(documents)
        .set({ inTrash: true, updatedAt: new Date().toISOString() })
        .where(inArray(documents.id, ids));

      return ids.length;
    });

    return { ok: true, data: count } as const;
  } catch (e) {
    const denied = forbiddenResult(e);
    if (denied) return denied;
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
    const hasProEntitlement = await workspaceOwnerHasProPlanEntitlement(
      existing.workspaceId
    );

    const count = await db.transaction(async (tx) => {
      const workspaceDocs = await loadWorkspaceDocuments(
        existing.workspaceId,
        tx
      );
      const ids = collectRestoreTargetIds(workspaceDocs, documentId);
      const topmost = workspaceDocs.find((document) => document.id === ids[0]);

      if (!topmost?.parentId) {
        assertRootPageQuota(
          workspaceDocs,
          existing.workspaceId,
          hasProEntitlement,
          null
        );
      }

      await tx
        .update(documents)
        .set({ inTrash: false, updatedAt: new Date().toISOString() })
        .where(inArray(documents.id, ids));

      return ids.length;
    });

    return { ok: true, data: count } as const;
  } catch (e) {
    const failure = mutationFailure(e);
    if (failure) return failure;
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

    const count = await db.transaction(async (tx) => {
      const workspaceDocs = await loadWorkspaceDocuments(
        existing.workspaceId,
        tx
      );
      const ids = assertPermanentDeleteAllowed(workspaceDocs, documentId);

      // One statement: the parent FK is RESTRICT, which is checked after the
      // statement, so parents and children can go together. Realtime state
      // rows cascade from documents.
      await tx.delete(documents).where(inArray(documents.id, ids));

      return ids.length;
    });

    return { ok: true, data: count } as const;
  } catch (e) {
    const failure = mutationFailure(e);
    if (failure) return failure;
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

    const inserted = await db.transaction(async (tx) => {
      const workspaceDocs = await loadWorkspaceDocuments(
        source.workspaceId,
        tx
      );
      const plan = planDeepDuplicate(workspaceDocs, sourceId, newId, uuid);
      const sourceIds = plan.map((node) => node.sourceId);
      const sourceRows = await tx
        .select({ id: documents.id, content: documents.content })
        .from(documents)
        .where(inArray(documents.id, sourceIds));
      const fallbackBySourceId = new Map(
        sourceRows.map((row) => [row.id, row.content])
      );
      const authoritativeContent =
        await loadAuthoritativeDocumentContentBySourceIds(
          sourceIds,
          fallbackBySourceId,
          tx
        );

      const now = new Date().toISOString();
      const rows = plan.map((node) => ({
        id: node.id,
        workspaceId: source.workspaceId,
        parentId: node.parentId,
        title: node.title,
        icon: node.icon,
        bannerUrl: node.bannerUrl,
        content: authoritativeContent.get(node.sourceId) ?? null,
        createdAt: now,
        updatedAt: now,
      }));

      return tx
        .insert(documents)
        .values(rows)
        .returning(documentSummaryColumns);
    });

    return {
      ok: true,
      data: inserted.find((row) => row.id === newId) ?? inserted[0],
    } as const;
  } catch (e) {
    const denied = forbiddenResult(e);
    if (denied) return denied;
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

  const rows = await getDocuments(workspaceId);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const chain: DocumentSummary[] = [];
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
