import type { PartialBlock } from "@blocknote/core";

export function parseStoredDocumentContent(
  content: string | null | undefined,
): PartialBlock[] | undefined {
  if (!content?.trim()) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as PartialBlock[];
  } catch {
    return undefined;
  }
}

export function serializeDocumentContent(blocks: readonly unknown[]): string {
  return JSON.stringify(blocks);
}
