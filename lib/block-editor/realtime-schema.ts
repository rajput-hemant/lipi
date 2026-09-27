import {
  BlockNoteEditor,
  BlockNoteSchema,
  createBlockSpec,
} from "@blocknote/core";

import { alertBlockConfig } from "./alert-block-config";

const createServerAlertBlock = createBlockSpec(alertBlockConfig, {
  render: () => ({ dom: document.createElement("div") }),
});

export const realtimeBlockEditorSchema = BlockNoteSchema.create().extend({
  blockSpecs: { alert: createServerAlertBlock() },
});

export type RealtimeBlockEditorSchema = typeof realtimeBlockEditorSchema;

export const realtimeBlockNoteEditor = BlockNoteEditor.create({
  schema: realtimeBlockEditorSchema,
});
