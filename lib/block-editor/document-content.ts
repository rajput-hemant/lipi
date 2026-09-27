import type { PartialBlock } from "@blocknote/core";

export type StoredDocumentContentState =
  | { status: "empty" }
  | { status: "ready"; blocks: PartialBlock[] }
  | { status: "corrupt" };

export function getStoredDocumentContentState(
  content: string | null | undefined,
): StoredDocumentContentState {
  if (!content?.trim()) {
    return { status: "empty" };
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return { status: "corrupt" };
    }

    return { status: "ready", blocks: parsed as PartialBlock[] };
  } catch {
    return { status: "corrupt" };
  }
}

export function parseStoredDocumentContent(
  content: string | null | undefined,
): PartialBlock[] | undefined {
  const state = getStoredDocumentContentState(content);
  if (state.status === "ready") {
    return state.blocks;
  }

  return undefined;
}

export function serializeDocumentContent(blocks: readonly unknown[]): string {
  return JSON.stringify(blocks);
}
