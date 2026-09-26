import React from "react";
import { proxy, useSnapshot } from "valtio";

import type { SessionUser } from "@/lib/auth/types";
import type { File, Folder } from "@/types/db";

export type AppState = {
  user: SessionUser | null;
  files: File[];
  folders: Folder[];
};

export type AppAction = {
  addFile: (file: File) => void;
  updateFile: (file: File) => void;
  deleteFile: (fileId: string) => void;

  addFolder: (folder: Folder) => void;
  updateFolder: (folder: Folder) => void;
  deleteFolder: (folderId: string) => void;
};

export type Store = AppState & AppAction;

export function createAppStore(initial: AppState): Store {
  const store = proxy<Store>({
    user: initial.user,
    files: initial.files,
    folders: initial.folders,

    addFile(file) {
      store.files.push(file);
    },
    updateFile(file) {
      store.files = store.files.map((f) => (f.id === file.id ? file : f));
    },
    deleteFile(id) {
      store.files = store.files.filter((f) => f.id !== id);
    },

    addFolder(folder) {
      store.folders.push(folder);
    },
    updateFolder(folder: Folder) {
      store.folders = store.folders.map((f) =>
        f.id === folder.id ? folder : f
      );
    },
    deleteFolder(id) {
      store.folders = store.folders.filter((f) => f.id !== id);
    },
  });

  return store;
}

export function syncAppStore(store: Store, state: AppState) {
  store.user = state.user;
  store.files = state.files;
  store.folders = state.folders;
}

export const AppStateContext = React.createContext<Store | null>(null);

export function useAppState() {
  const store = React.useContext(AppStateContext);
  if (!store)
    throw new Error("Cannot use `useAppState` outside of a `StoreProvider`");

  return useSnapshot(store);
}
