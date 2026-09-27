import { BlockNoteSchema } from "@blocknote/core";

import { createCalloutBlock } from "./alert-block";

export const blockEditorSchema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createCalloutBlock(),
  },
});

export type BlockEditorSchema = typeof blockEditorSchema;
