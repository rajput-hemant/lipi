"use client";

import React from "react";

import type { AppState } from "@/hooks/use-app-state";

import {
  AppStateContext,
  createAppStore,
  syncAppStore,
} from "@/hooks/use-app-state";

type AppStateProviderProps = React.PropsWithChildren<
  Pick<AppState, "user" | "documents"> & {
    workspace?: AppState["workspace"];
  }
>;

export function AppStateProvider({
  children,
  user,
  workspace,
  documents,
}: AppStateProviderProps) {
  const [store] = React.useState(() =>
    createAppStore({ user, workspace, documents })
  );

  React.useEffect(() => {
    syncAppStore(store, { user, workspace, documents });
  }, [store, user, workspace, documents]);

  return (
    <AppStateContext.Provider value={store}>
      {children}
    </AppStateContext.Provider>
  );
}
