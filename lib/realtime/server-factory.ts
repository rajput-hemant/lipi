import { Server } from "@hocuspocus/server";

import type { RealtimeContext, RealtimeRoomAccess } from "./context";
import type {
  beforeSyncPayload,
  Connection,
  Extension,
} from "@hocuspocus/server";

import { hasWorkspacePermission } from "@/lib/workspace/permissions";
import { RealtimeAuthorizationError } from "./context";
import { parseRealtimeRoomName } from "./rooms";
import { verifyRealtimeToken } from "./token";

type RealtimeQuotaGuard = {
  beforeSync(payload: beforeSyncPayload<RealtimeContext>): Promise<void>;
  release(documentName: string, connection: Connection<RealtimeContext>): void;
};

type RealtimeServerOptions = {
  address: string;
  allowedOrigins: ReadonlySet<string>;
  authorizeRoom(userId: string, roomName: string): Promise<RealtimeRoomAccess>;
  extensions: Extension[];
  port: number;
  debounce?: number;
  maxDebounce?: number;
  originIsAllowed?: (origin: string | null) => boolean;
  quotaGuard?: RealtimeQuotaGuard;
  secret: string;
  verifyToken?: typeof verifyRealtimeToken;
};

function userColor(userId: string) {
  const colors = [
    "#db2777",
    "#ea580c",
    "#16a34a",
    "#0891b2",
    "#8b5cf6",
    "#ca8a04",
    "#dc2626",
  ];
  const hash = Array.from(userId).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  );

  return colors[hash % colors.length];
}

export function createRealtimeServer({
  address,
  allowedOrigins,
  authorizeRoom,
  extensions,
  port,
  debounce = 1000,
  maxDebounce = 5000,
  originIsAllowed = (origin) => Boolean(origin && allowedOrigins.has(origin)),
  quotaGuard,
  secret,
  verifyToken = verifyRealtimeToken,
}: RealtimeServerOptions) {
  function makeContext(token: string, roomName: string) {
    const payload = verifyToken(token, roomName, secret);
    if (!payload) throw new RealtimeAuthorizationError();
    return payload;
  }

  return new Server<RealtimeContext>({
    name: "lipi-realtime",
    address,
    port,
    debounce,
    maxDebounce,
    quiet: true,
    maxUnauthenticatedQueueSize: 1024 * 1024,
    maxUnauthenticatedQueueMessages: 100,
    maxPendingDocuments: 4,
    websocketOptions: { maxPayload: 1024 * 1024 },
    extensions,
    onAuthenticate: async ({
      documentName,
      requestHeaders,
      token,
      connectionConfig,
    }) => {
      const origin = requestHeaders.get("origin");
      if (!originIsAllowed(origin)) {
        throw new RealtimeAuthorizationError();
      }

      const payload = makeContext(token, documentName);
      const access = await authorizeRoom(payload.userId, documentName);
      connectionConfig.readOnly = access.readOnly;

      return {
        ...access,
        userId: payload.userId,
        name: payload.name,
        image: payload.image,
        readOnly: access.readOnly,
      };
    },
    onTokenSync: async ({ token, documentName, connection }) => {
      const payload = makeContext(token, documentName);
      const access = await authorizeRoom(payload.userId, documentName);
      connection.readOnly = access.readOnly;
      connection.context = {
        ...access,
        userId: payload.userId,
        name: payload.name,
        image: payload.image,
        readOnly: access.readOnly,
      };

      return connection.context;
    },
    beforeHandleAwareness: async ({ states, context, documentName }) => {
      if (!context) return;

      try {
        await authorizeRoom(context.userId, documentName);
      } catch (error) {
        states.clear();
        if (!(error instanceof RealtimeAuthorizationError)) {
          console.error("Lipi realtime awareness authorization failed", error);
        }
        return;
      }

      const user = {
        id: context.userId,
        name: context.name,
        image: context.image,
        color: userColor(context.userId),
      };

      for (const state of states.values()) state.user = user;
    },
    beforeSync: async (payload) => {
      const { context, connection, documentName } = payload;
      if (!context) throw new RealtimeAuthorizationError();

      const access = await authorizeRoom(context.userId, documentName);
      connection.readOnly = access.readOnly;
      if (access.readOnly) return;

      await quotaGuard?.beforeSync({
        ...payload,
        context: { ...context, ...access, readOnly: false },
      });
    },
    onChange: async ({ documentName, connection }) => {
      if (connection) quotaGuard?.release(documentName, connection);
    },
    afterHandleMessage: async ({ documentName, connection }) => {
      quotaGuard?.release(documentName, connection);
    },
    onStateless: async ({ connection, document, documentName, payload }) => {
      const room = parseRealtimeRoomName(documentName);
      if (room?.kind !== "workspace" || payload !== "pages:changed") return;

      try {
        const access = await authorizeRoom(
          connection.context.userId,
          documentName
        );
        if (hasWorkspacePermission(access.role, "document:write")) {
          document.broadcastStateless(payload, (peer) => peer !== connection);
        }
      } catch (error) {
        if (!(error instanceof RealtimeAuthorizationError)) {
          console.error("Lipi realtime workspace notification failed", error);
        }
        return;
      }
    },
    onListen: async ({ port: listeningPort }) => {
      console.info(`Lipi realtime listening on ${listeningPort}`);
    },
  });
}
