"use server";

import type { BlockNoteEditor } from "@blocknote/core";

import { updateDocument } from "@/lib/db/queries/document";
import { DOCUMENT_CONTENT_MAX_LENGTH } from "@/lib/validations/document";

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

  if (content.length > DOCUMENT_CONTENT_MAX_LENGTH) {
    throw new Error("Document content is too large");
  }

  return updateDocument({
    id: input.documentId,
    content,
  });
}
