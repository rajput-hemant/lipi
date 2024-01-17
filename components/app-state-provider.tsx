"use client";

import React from "react";

import type { AppState } from "@/hooks/use-app-state";

import { AppStateContext, setStore, store } from "@/hooks/use-app-state";

type AppStateProviderProps = React.PropsWithChildren<AppState>;

export function AppStateProvider(props: AppStateProviderProps) {
  setStore(props);

  return (
    <AppStateContext.Provider value={store}>
      {props.children}
    </AppStateContext.Provider>
  );
}
