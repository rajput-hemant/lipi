"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { validate as validateUuid } from "uuid";

import type { Document } from "@/types/db";

import {
  collectDescendantIds,
  type DocumentRecord,
} from "@/lib/db/documents-tree";
import {
  createDocumentSchema,
  duplicateDocumentSchema,
  updateDocumentSchema,
} from "@/lib/validations/document";

import { db } from "..";
import { documents } from "../schema";
import {
  assertDocumentAccess,
  authorizeWorkspaceMutation,
  MutationAuthError,
  requireAuthenticatedUser,
} from "./mutation-auth";

function revalidateDocuments() {
  revalidateTag("get_documents", "max");
}

export async function createDocument(input: unknown) {
  const parsed = createDocumentSchema.parse(input);

  try {
    await authorizeWorkspaceMutation(parsed.workspaceId);

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

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create document");
  } finally {
    revalidateDocuments();
  }
}

export const getDocuments = cache(
  async (workspaceId: string) => {
    if (!validateUuid(workspaceId)) {
      throw new Error("Invalid workspace ID");
    }

    try {
      return await db
        .select()
        .from(documents)
        .where(eq(documents.workspaceId, workspaceId))
        .orderBy(documents.createdAt);
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch documents from the database");
    }
  },
  ["get_documents"],
  { tags: ["get_documents"] },
);

export const getDocumentsFromDb = getDocuments;

export async function updateDocument(input: unknown) {
  const parsed = updateDocumentSchema.parse(input);

  try {
    if (!parsed.id) {
      throw new MutationAuthError("Invalid document");
    }

    const user = await requireAuthenticatedUser();
    await assertDocumentAccess(user.id, parsed.id);

    const { id, ...patch } = parsed;

    const [data] = await db
      .update(documents)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to update document");
  } finally {
    revalidateDocuments();
  }
}

export const updateDocumentInDb = updateDocument;

export async function softDeleteDocumentTree(documentId: string) {
  try {
    const user = await requireAuthenticatedUser();
    const root = await assertDocumentAccess(user.id, documentId);

    const workspaceDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.workspaceId, root.workspaceId));

    const descendantIds = collectDescendantIds(
      workspaceDocs as DocumentRecord[],
      documentId,
    );
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
    revalidateDocuments();
  }
}

export async function restoreDocument(documentId: string) {
  return updateDocument({ id: documentId, inTrash: false });
}

export async function deleteDocumentPermanently(documentId: string) {
  try {
    const user = await requireAuthenticatedUser();
    await assertDocumentAccess(user.id, documentId);

    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, documentId))
      .returning();

    return deleted;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to delete document");
  } finally {
    revalidateDocuments();
  }
}

export async function duplicateDocument(input: unknown) {
  const { sourceId, newId } = duplicateDocumentSchema.parse(input);

  try {
    const user = await requireAuthenticatedUser();
    const source = await assertDocumentAccess(user.id, sourceId);

    const [copy] = await db
      .insert(documents)
      .values({
        id: newId,
        workspaceId: source.workspaceId,
        parentId: source.parentId,
        title: `${source.title} copy`,
        icon: source.icon,
        bannerUrl: source.bannerUrl,
        content: source.content,
      })
      .returning();

    return copy;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to duplicate document");
  } finally {
    revalidateDocuments();
  }
}

export async function getDocumentBreadcrumbs(
  workspaceId: string,
  documentId: string,
) {
  if (!validateUuid(workspaceId) || !validateUuid(documentId)) {
    return [];
  }

  const rows = await getDocuments(workspaceId);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const chain: Document[] = [];
  let current = byId.get(documentId);

  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    current = byId.get(current.parentId);
  }

  return chain;
}
