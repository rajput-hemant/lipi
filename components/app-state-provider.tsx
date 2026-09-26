"use client";

import React from "react";

import type { AppState } from "@/hooks/use-app-state";

import {
  AppStateContext,
  createAppStore,
  syncAppStore,
} from "@/hooks/use-app-state";

type AppStateProviderProps = React.PropsWithChildren<AppState>;

export function AppStateProvider({
  children,
  user,
  documents,
}: AppStateProviderProps) {
  const [store] = React.useState(() =>
    createAppStore({ user, documents }),
  );

  React.useEffect(() => {
    syncAppStore(store, { user, documents });
  }, [store, user, documents]);

  return (
    <AppStateContext.Provider value={store}>{children}</AppStateContext.Provider>
  );
}
