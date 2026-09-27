import type {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  PartialBlock,
  StyleSchema,
} from "@blocknote/core";

export type StoredDocumentContentState<
  BSchema extends BlockSchema = DefaultBlockSchema,
  ISchema extends InlineContentSchema = DefaultInlineContentSchema,
  SSchema extends StyleSchema = DefaultStyleSchema,
> =
  | { status: "empty" }
  | { status: "ready"; blocks: PartialBlock<BSchema, ISchema, SSchema>[] }
  | { status: "corrupt" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredBlockArray<
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(value: unknown): value is PartialBlock<BSchema, ISchema, SSchema>[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (entry) => isRecord(entry) && typeof entry.type === "string"
  );
}

export function getStoredDocumentContentState<
  BSchema extends BlockSchema = DefaultBlockSchema,
  ISchema extends InlineContentSchema = DefaultInlineContentSchema,
  SSchema extends StyleSchema = DefaultStyleSchema,
>(
  content: string | null | undefined
): StoredDocumentContentState<BSchema, ISchema, SSchema> {
  if (!content?.trim()) {
    return { status: "empty" };
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!isStoredBlockArray<BSchema, ISchema, SSchema>(parsed)) {
      return { status: "corrupt" };
    }

    return { status: "ready", blocks: parsed };
  } catch {
    return { status: "corrupt" };
  }
}

export function parseStoredDocumentContent<
  BSchema extends BlockSchema = DefaultBlockSchema,
  ISchema extends InlineContentSchema = DefaultInlineContentSchema,
  SSchema extends StyleSchema = DefaultStyleSchema,
>(
  content: string | null | undefined
): PartialBlock<BSchema, ISchema, SSchema>[] | undefined {
  const state = getStoredDocumentContentState<BSchema, ISchema, SSchema>(
    content
  );
  if (state.status === "ready") {
    return state.blocks;
  }

  return undefined;
}

export function serializeDocumentContent(blocks: readonly unknown[]): string {
  return JSON.stringify(blocks);
}
