import type { PartialBlock } from "@blocknote/core";

export type StoredDocumentContentState =
  | { status: "empty" }
  | { status: "ready"; blocks: PartialBlock[] }
  | { status: "corrupt" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredBlockArray(value: unknown): value is PartialBlock[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((entry) => isRecord(entry) && typeof entry.type === "string");
}

export function getStoredDocumentContentState(
  content: string | null | undefined,
): StoredDocumentContentState {
  if (!content?.trim()) {
    return { status: "empty" };
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!isStoredBlockArray(parsed)) {
      return { status: "corrupt" };
    }

    return { status: "ready", blocks: parsed };
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
