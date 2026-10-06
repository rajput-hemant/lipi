"use client";

import React from "react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { filterSuggestionItems } from "@blocknote/core/extensions";
import { withCollaboration } from "@blocknote/core/yjs";
import {
  blockTypeSelectItems,
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useBlockNoteEditor,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import type { onCloseParameters } from "@hocuspocus/provider";
import type { Document } from "@/types/db";

import { useAppActions, useAppState } from "@/hooks/use-app-state";
import {
  calloutBlockTypeSelectItem,
  insertCalloutSlashMenuItem,
} from "@/lib/block-editor/callout-menu-items";
import { blockEditorSchema } from "@/lib/block-editor/editor-schema";
import { lipiBlockNoteShadcnComponents } from "@/lib/block-editor/lipi-shadcn-components";
import { fetchRealtimeAccess, getRealtimeUrl } from "@/lib/realtime/client";
import { BLOCKNOTE_FRAGMENT } from "@/lib/realtime/constants";
import { readCollaboratorPresence } from "@/lib/realtime/presence";
import { documentRoomName } from "@/lib/realtime/rooms";
import { uploadImage } from "@/lib/uploadthing";

type DocumentBlockEditorProps = {
  document: Document;
};

function createRealtimeProviderStore() {
  let provider: HocuspocusProvider | null = null;
  const subscribers = new Set<() => void>();

  return {
    getSnapshot: () => provider,
    subscribe: (subscriber: () => void) => {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    setProvider: (next: HocuspocusProvider | null) => {
      provider = next;
      for (const subscriber of subscribers) subscriber();
    },
  };
}

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
  const url = getRealtimeUrl();
  const roomName = documentRoomName(document.id);
  const [providerStore] = React.useState(createRealtimeProviderStore);
  const provider = React.useSyncExternalStore(
    providerStore.subscribe,
    providerStore.getSnapshot,
    providerStore.getSnapshot
  );
  const [isReadOnly, setIsReadOnly] = React.useState(true);

  React.useEffect(() => {
    if (!url) return;

    const connection = new HocuspocusProvider({
      url,
      name: roomName,
      token: async () => {
        const access = await fetchRealtimeAccess(roomName);
        setIsReadOnly(access.readOnly);
        return access.token;
      },
    });

    providerStore.setProvider(connection);
    return () => {
      providerStore.setProvider(null);
      connection.destroy();
    };
  }, [providerStore, roomName, url]);

  if (!url) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8" role="alert">
        Real-time editing is unavailable.
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8" role="status">
        Connecting to collaborators...
      </div>
    );
  }

  return (
    <DocumentBlockEditorConnected
      document={document}
      provider={provider}
      isReadOnly={isReadOnly}
      resolvedTheme={resolvedTheme}
    />
  );
}

type DocumentBlockEditorConnectedProps = {
  document: Document;
  provider: HocuspocusProvider;
  isReadOnly: boolean;
  resolvedTheme: string | undefined;
};

function DocumentBlockEditorConnected({
  document,
  provider,
  isReadOnly,
  resolvedTheme,
}: DocumentBlockEditorConnectedProps) {
  const { user } = useAppState();
  const { setCollaborators } = useAppActions();
  const [connectionStatus, setConnectionStatus] = React.useState(() =>
    provider.configuration.websocketProvider?.status === "connected" ?
      "connected"
    : "connecting"
  );
  const [isSynced, setIsSynced] = React.useState(() => provider.synced);
  const [blockQuotaExceeded, setBlockQuotaExceeded] = React.useState(false);

  React.useEffect(() => {
    const onStatus = ({ status }: { status: string }) => {
      setConnectionStatus(status);
      if (status !== "connected") setIsSynced(false);
    };
    const onSynced = ({ state }: { state: boolean }) => setIsSynced(state);
    const onClose = ({ event }: onCloseParameters) => {
      if (event.reason === "plan-quota-exceeded:block") {
        setBlockQuotaExceeded(true);
      }
    };
    const refreshToken = () => void provider.sendToken();
    const awareness = provider.awareness;
    const updateCollaborators = () => {
      if (awareness) {
        setCollaborators(
          readCollaboratorPresence(awareness.getStates().values())
        );
      }
    };

    provider.on("status", onStatus);
    provider.on("synced", onSynced);
    provider.on("close", onClose);
    awareness?.on("change", updateCollaborators);
    updateCollaborators();

    const refreshInterval = window.setInterval(refreshToken, 30_000);

    return () => {
      window.clearInterval(refreshInterval);
      provider.off("status", onStatus);
      provider.off("synced", onSynced);
      provider.off("close", onClose);
      awareness?.off("change", updateCollaborators);
      setCollaborators([]);
    };
  }, [provider, setCollaborators]);

  const uploadFile = React.useCallback(
    async (file: File) => {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("File is too large (max 4MB)");
        throw new Error("File is too large (max 4MB)");
      }

      try {
        return await uploadImage("documentImage", file, document.workspaceId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Image upload failed";
        toast.error(message);
        throw error;
      }
    },
    [document.workspaceId]
  );

  const editor = useCreateBlockNote(
    withCollaboration({
      schema: blockEditorSchema,
      uploadFile,
      domAttributes: { editor: { "aria-label": "Page content" } },
      collaboration: {
        provider: { awareness: provider.awareness ?? undefined },
        fragment: provider.document.getXmlFragment(BLOCKNOTE_FRAGMENT),
        user: {
          name: user?.name || user?.email || "Collaborator",
          color: "#7c3aed",
        },
        showCursorLabels: "always",
      },
    })
  );

  const editorTheme = resolvedTheme === "dark" ? "dark" : "light";
  const editable =
    connectionStatus === "connected" &&
    isSynced &&
    !isReadOnly &&
    !blockQuotaExceeded;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24">
      {blockQuotaExceeded ?
        <p className="py-2 text-sm text-destructive" role="alert">
          Free plan allows up to 500 blocks. Your latest changes were not saved.
          Reload to restore the saved page, or upgrade to Pro for unlimited
          blocks.
        </p>
      : null}
      {connectionStatus !== "connected" || !isSynced || isReadOnly ?
        <p className="py-2 text-sm text-muted-foreground" role="status">
          {connectionStatus !== "connected" ?
            "Reconnecting to collaborators..."
          : !isSynced ?
            "Syncing page..."
          : "View only"}
        </p>
      : null}
      <BlockNoteView
        editor={editor}
        editable={editable}
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
              (item) => item.group === "Basic blocks"
            );
            defaultItems.splice(
              lastBasicBlockIndex + 1,
              0,
              insertCalloutSlashMenuItem(editor)
            );
            return filterSuggestionItems(defaultItems, query);
          }}
        />
      </BlockNoteView>
    </div>
  );
}
