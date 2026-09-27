"use client";

import React from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
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
import { getStoredDocumentContentState } from "@/lib/block-editor/document-content";
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
  const contentState = React.useMemo(
    () => getStoredDocumentContentState(document.content),
    [document.content],
  );

  if (contentState.status === "corrupt") {
    return (
      <div
        className="mx-auto w-full max-w-3xl px-6 py-8"
        role="alert"
      >
        <p className="font-medium text-destructive">
          This page could not be loaded.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The stored document content is invalid. Editing is disabled so your
          data is not overwritten.
        </p>
      </div>
    );
  }

  return (
    <DocumentBlockEditorLoaded
      document={document}
      initialContent={
        contentState.status === "ready" ? contentState.blocks : undefined
      }
      resolvedTheme={resolvedTheme}
    />
  );
}

type DocumentBlockEditorLoadedProps = {
  document: Document;
  initialContent: PartialBlock[] | undefined;
  resolvedTheme: string | undefined;
};

function DocumentBlockEditorLoaded({
  document,
  initialContent,
  resolvedTheme,
}: DocumentBlockEditorLoadedProps) {
  const editor = useCreateBlockNote({
    schema: blockEditorSchema,
    initialContent,
  });

  const { debounced: persistContent, flush: flushContent } = useDebouncedCallback(
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

  React.useEffect(() => {
    const onBeforeUnload = () => {
      flushContent();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flushContent]);

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
