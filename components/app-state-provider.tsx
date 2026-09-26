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
  files,
  folders,
}: AppStateProviderProps) {
  const [store] = React.useState(() =>
    createAppStore({ user, files, folders })
  );

  React.useEffect(() => {
    syncAppStore(store, { user, files, folders });
  }, [store, user, files, folders]);

  return (
    <AppStateContext.Provider value={store}>{children}</AppStateContext.Provider>
  );
}
