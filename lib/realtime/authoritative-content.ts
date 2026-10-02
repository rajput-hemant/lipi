import { yDocToBlocks } from "@blocknote/core/yjs";
import { inArray } from "drizzle-orm";
import * as Y from "yjs";

import { serializeDocumentContent } from "@/lib/block-editor/document-content";
import { realtimeBlockNoteEditor } from "@/lib/block-editor/realtime-schema";
import { db } from "@/lib/db";
import { realtimeDocuments } from "@/lib/db/schema";
import { BLOCKNOTE_FRAGMENT } from "./constants";

export function serializedContentFromYjsState(state: Uint8Array): string {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, state);
  const blocks = yDocToBlocks(
    realtimeBlockNoteEditor,
    ydoc,
    BLOCKNOTE_FRAGMENT
  );
  ydoc.destroy();
  return serializeDocumentContent(blocks);
}

export async function loadAuthoritativeDocumentContentBySourceIds(
  sourceIds: readonly string[],
  fallbackBySourceId: ReadonlyMap<string, string | null>
): Promise<Map<string, string | null>> {
  const uniqueIds = [...new Set(sourceIds)];
  const result = new Map<string, string | null>();

  if (uniqueIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      documentId: realtimeDocuments.documentId,
      state: realtimeDocuments.state,
    })
    .from(realtimeDocuments)
    .where(inArray(realtimeDocuments.documentId, uniqueIds));

  const stateById = new Map(rows.map((row) => [row.documentId, row.state]));

  for (const id of uniqueIds) {
    const state = stateById.get(id);
    if (state) {
      result.set(id, serializedContentFromYjsState(state));
    } else {
      result.set(id, fallbackBySourceId.get(id) ?? null);
    }
  }

  return result;
}
