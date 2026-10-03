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
    role?: AppState["role"];
  }
>;

export function AppStateProvider({
  children,
  user,
  workspace,
  role,
  documents,
}: AppStateProviderProps) {
  const [store] = React.useState(() =>
    createAppStore({ user, workspace, role, documents })
  );

  React.useEffect(() => {
    syncAppStore(store, { user, workspace, role, documents });
  }, [store, user, workspace, role, documents]);

  return (
    <AppStateContext.Provider value={store}>
      {children}
    </AppStateContext.Provider>
  );
}
