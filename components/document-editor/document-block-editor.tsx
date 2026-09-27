"use client";

import React from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import type { BlockNoteEditor } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  blockTypeSelectItems,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useBlockNoteEditor,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import type { Document } from "@/types/db";

import {
  calloutBlockTypeSelectItem,
  insertCalloutSlashMenuItem,
} from "@/lib/block-editor/callout-menu-items";
import { parseStoredDocumentContent } from "@/lib/block-editor/document-content";
import { blockEditorSchema, type BlockEditorSchema } from "@/lib/block-editor/editor-schema";
import { lipiBlockNoteShadcnComponents } from "@/lib/block-editor/lipi-shadcn-components";
import { saveDocumentContent } from "@/lib/block-editor/save-document-content";
import { useDebouncedCallback } from "@/lib/block-editor/use-debounced-callback";

type BlockEditorInstance = BlockNoteEditor<
  BlockEditorSchema["blockSchema"],
  BlockEditorSchema["inlineContentSchema"],
  BlockEditorSchema["styleSchema"]
>;

type DocumentBlockEditorProps = {
  document: Document;
};

function DocumentFormattingToolbar() {
  const editor = useBlockNoteEditor<
    typeof blockEditorSchema.blockSchema,
    typeof blockEditorSchema.inlineContentSchema,
    typeof blockEditorSchema.styleSchema
  >();

  return (
    <FormattingToolbar
      blockTypeSelectItems={[
        ...blockTypeSelectItems(editor.dictionary),
        calloutBlockTypeSelectItem,
      ]}
    />
  );
}

export function DocumentBlockEditor({ document }: DocumentBlockEditorProps) {
  const { resolvedTheme } = useTheme();
  const initialContent = React.useMemo(
    () => parseStoredDocumentContent(document.content),
    [document.content],
  );

  const editor = useCreateBlockNote({
    schema: blockEditorSchema,
    initialContent,
  });

  const persistContent = useDebouncedCallback(
    async (blocks: BlockEditorInstance["document"]) => {
      try {
        await saveDocumentContent({
          documentId: document.id,
          blocks,
        });
      } catch {
        toast.error("Could not save document.");
      }
    },
    800,
  );

  useEditorChange(() => {
    persistContent(editor.document);
  }, editor);

  const editorTheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24">
      <BlockNoteView
        editor={editor}
        theme={editorTheme}
        shadCNComponents={lipiBlockNoteShadcnComponents}
        formattingToolbar={false}
        slashMenu={false}
        className="min-h-[50vh] [&_.bn-editor]:px-0"
      >
        <FormattingToolbarController
          formattingToolbar={() => <DocumentFormattingToolbar />}
        />
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => {
            const defaultItems = getDefaultReactSlashMenuItems(editor);
            const lastBasicBlockIndex = defaultItems.findLastIndex(
              (item) => item.group === "Basic blocks",
            );
            defaultItems.splice(
              lastBasicBlockIndex + 1,
              0,
              insertCalloutSlashMenuItem(editor),
            );
            return filterSuggestionItems(defaultItems, query);
          }}
        />
      </BlockNoteView>
    </div>
  );
}
