"use server";

import type { BlockNoteEditor } from "@blocknote/core";

import { updateDocument } from "@/lib/db/queries/document";

import { serializeDocumentContent } from "./document-content";
import type { BlockEditorSchema } from "./editor-schema";

type BlockEditorInstance = BlockNoteEditor<
  BlockEditorSchema["blockSchema"],
  BlockEditorSchema["inlineContentSchema"],
  BlockEditorSchema["styleSchema"]
>;

type SaveDocumentContentInput = {
  documentId: string;
  blocks: BlockEditorInstance["document"];
};

export async function saveDocumentContent(input: SaveDocumentContentInput) {
  const content = serializeDocumentContent(input.blocks);

  return updateDocument({
    id: input.documentId,
    content,
  });
}
