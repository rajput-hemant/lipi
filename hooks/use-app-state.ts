import React from "react";
import { proxy, useSnapshot } from "valtio";

import type { SessionUser } from "@/lib/auth/types";
import type { Document } from "@/types/db";

export type AppState = {
  user: SessionUser | null;
  documents: Document[];
};

export type AppAction = {
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  deleteDocument: (documentId: string) => void;
};

export type Store = AppState & AppAction;

export function createAppStore(initial: AppState): Store {
  const store = proxy<Store>({
    user: initial.user,
    documents: initial.documents,

    addDocument(document) {
      store.documents.push(document);
    },
    updateDocument(document) {
      store.documents = store.documents.map((entry) =>
        entry.id === document.id ? document : entry,
      );
    },
    deleteDocument(id) {
      store.documents = store.documents.filter((entry) => entry.id !== id);
    },
  });

  return store;
}

export function syncAppStore(store: Store, state: AppState) {
  store.user = state.user;
  store.documents = state.documents;
}

export const AppStateContext = React.createContext<Store | null>(null);

export function useAppState() {
  const store = React.useContext(AppStateContext);
  if (!store)
    throw new Error("Cannot use `useAppState` outside of a `StoreProvider`");

  return useSnapshot(store);
}
