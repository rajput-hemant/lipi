import { blocksToYDoc, yDocToBlocks } from "@blocknote/core/yjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import type { PartialBlock } from "@blocknote/core";
import type { RealtimeBlockEditorSchema } from "@/lib/block-editor/realtime-schema";

import { serializeDocumentContent } from "@/lib/block-editor/document-content";
import { realtimeBlockNoteEditor } from "@/lib/block-editor/realtime-schema";
import {
  loadAuthoritativeDocumentContentBySourceIds,
  serializedContentFromYjsState,
} from "./authoritative-content";
import { BLOCKNOTE_FRAGMENT } from "./constants";

type RealtimePartialBlock = PartialBlock<
  RealtimeBlockEditorSchema["blockSchema"],
  RealtimeBlockEditorSchema["inlineContentSchema"],
  RealtimeBlockEditorSchema["styleSchema"]
>;

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
  },
}));

describe("serializedContentFromYjsState", () => {
  it("round-trips BlockNote blocks through Yjs", () => {
    const blocks: RealtimePartialBlock[] = [
      { type: "paragraph", content: "Live edit" },
    ];
    const ydoc = blocksToYDoc(
      realtimeBlockNoteEditor,
      blocks,
      BLOCKNOTE_FRAGMENT
    );
    const state = Y.encodeStateAsUpdate(ydoc);
    const expected = serializeDocumentContent(
      yDocToBlocks(realtimeBlockNoteEditor, ydoc, BLOCKNOTE_FRAGMENT)
    );
    ydoc.destroy();

    expect(serializedContentFromYjsState(state)).toBe(expected);
  });
});

describe("loadAuthoritativeDocumentContentBySourceIds", () => {
  const docId = "123e4567-e89b-12d3-a456-426614174000";
  const staleJson = serializeDocumentContent([
    { type: "paragraph", content: "Stale snapshot" },
  ]);
  const liveBlocks: RealtimePartialBlock[] = [
    { type: "paragraph", content: "Authoritative Yjs" },
  ];
  let liveState: Uint8Array;
  let liveSerialized: string;

  beforeEach(() => {
    mockSelect.mockReset();
    const ydoc = blocksToYDoc(
      realtimeBlockNoteEditor,
      liveBlocks,
      BLOCKNOTE_FRAGMENT
    );
    liveState = Y.encodeStateAsUpdate(ydoc);
    liveSerialized = serializeDocumentContent(
      yDocToBlocks(realtimeBlockNoteEditor, ydoc, BLOCKNOTE_FRAGMENT)
    );
    ydoc.destroy();
  });

  it("prefers Yjs state over stale documents.content fallback", async () => {
    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([{ documentId: docId, state: liveState }]),
    };
    mockSelect.mockReturnValue(queryBuilder);

    const fallback = new Map([[docId, staleJson]]);
    const content = await loadAuthoritativeDocumentContentBySourceIds(
      [docId],
      fallback
    );

    expect(content.get(docId)).toBe(liveSerialized);
    expect(content.get(docId)).not.toBe(staleJson);
  });

  it("uses fallback when no realtime row exists", async () => {
    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    mockSelect.mockReturnValue(queryBuilder);

    const fallback = new Map([[docId, staleJson]]);
    const content = await loadAuthoritativeDocumentContentBySourceIds(
      [docId],
      fallback
    );

    expect(content.get(docId)).toBe(staleJson);
  });
});
