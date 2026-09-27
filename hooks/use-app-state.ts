import React from "react";
import { proxy, useSnapshot } from "valtio";

import type { SessionUser } from "@/lib/auth/types";
import type { Document } from "@/types/db";

export type AppState = {
  user: SessionUser | null;
  documents: Document[];
  collaborators: CollaboratorPresence[];
};

export type CollaboratorPresence = {
  id: string;
  name: string;
  image: string | null;
  color: string;
};

export type AppAction = {
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  deleteDocument: (documentId: string) => void;
  replaceDocuments: (documents: Document[]) => void;
  setCollaborators: (collaborators: CollaboratorPresence[]) => void;
};

export type Store = AppState & AppAction;

export function createAppStore(
  initial: Pick<AppState, "user" | "documents">
): Store {
  const store = proxy<Store>({
    user: initial.user,
    documents: initial.documents,
    collaborators: [],

    addDocument(document) {
      store.documents.push(document);
    },
    updateDocument(document) {
      store.documents = store.documents.map((entry) =>
        entry.id === document.id ? document : entry
      );
    },
    deleteDocument(id) {
      store.documents = store.documents.filter((entry) => entry.id !== id);
    },
    replaceDocuments(documents) {
      store.documents = documents;
    },
    setCollaborators(collaborators) {
      store.collaborators = collaborators;
    },
  });

  return store;
}

export function syncAppStore(
  store: Store,
  state: Pick<AppState, "user" | "documents">
) {
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

export function useAppActions() {
  const store = React.useContext(AppStateContext);
  if (!store)
    throw new Error("Cannot use `useAppActions` outside of a `StoreProvider`");

  return store;
}
