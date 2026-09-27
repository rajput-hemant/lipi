"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HocuspocusProvider } from "@hocuspocus/provider";

import { fetchRealtimeToken, getRealtimeUrl } from "@/lib/realtime/client";
import { getSharedHocuspocusWebsocket } from "@/lib/realtime/shared-websocket";
import { workspaceRoomName } from "@/lib/realtime/rooms";

const WorkspacePageChangesContext = React.createContext<() => void>(() => {});

type WorkspaceRealtimeProviderProps = React.PropsWithChildren<{
  workspaceId: string;
}>;

export function WorkspaceRealtimeProvider({
  children,
  workspaceId,
}: WorkspaceRealtimeProviderProps) {
  const router = useRouter();
  const roomName = workspaceRoomName(workspaceId);
  const url = getRealtimeUrl();
  const providerRef = React.useRef<HocuspocusProvider | null>(null);
  const pendingPageChangesRef = React.useRef(false);

  React.useEffect(() => {
    if (!url) return;

    const websocketProvider = getSharedHocuspocusWebsocket();
    if (!websocketProvider) return;

    const connection = new HocuspocusProvider({
      websocketProvider,
      name: roomName,
      token: () => fetchRealtimeToken(roomName),
    });
    connection.attach();
    const refreshPages = ({ payload }: { payload: string }) => {
      if (payload === "pages:changed") router.refresh();
    };
    const refreshOnConnect = ({ status }: { status: string }) => {
      if (status === "connected") router.refresh();
    };
    const sendPendingPageChanges = () => {
      if (!pendingPageChangesRef.current || !connection.isAuthenticated) return;

      pendingPageChangesRef.current = false;
      connection.sendStateless("pages:changed");
    };

    connection.on("stateless", refreshPages);
    connection.on("status", refreshOnConnect);
    connection.on("authenticated", sendPendingPageChanges);
    providerRef.current = connection;
    const refreshToken = window.setInterval(() => {
      void connection.sendToken();
    }, 30_000);

    return () => {
      window.clearInterval(refreshToken);
      connection.off("stateless", refreshPages);
      connection.off("status", refreshOnConnect);
      connection.off("authenticated", sendPendingPageChanges);
      providerRef.current = null;
      connection.destroy();
    };
  }, [roomName, router, url]);

  const notifyPageChanges = React.useCallback(() => {
    const connection = providerRef.current;
    if (connection?.isAuthenticated) {
      connection.sendStateless("pages:changed");
    } else {
      pendingPageChangesRef.current = true;
    }
  }, []);

  return (
    <WorkspacePageChangesContext.Provider value={notifyPageChanges}>
      {children}
    </WorkspacePageChangesContext.Provider>
  );
}

export function useNotifyWorkspacePageChanges() {
  return React.useContext(WorkspacePageChangesContext);
}
