import { Server } from "@hocuspocus/server";

import type { RealtimeContext, RealtimeRoomAccess } from "./context";
import type {
  beforeSyncPayload,
  Connection,
  Extension,
} from "@hocuspocus/server";

import { logger } from "@/lib/logger";
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
};

function userColor(userId: string) {
  const colors = [
    "#db2777",
    "#c2410c",
    "#15803d",
    "#0e7490",
    "#7c3aed",
    "#a16207",
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
}: RealtimeServerOptions) {
  async function buildContext(
    token: string,
    roomName: string
  ): Promise<RealtimeContext> {
    const payload = verifyRealtimeToken(token, roomName, secret);
    if (!payload) throw new RealtimeAuthorizationError();
    const access = await authorizeRoom(payload.userId, roomName);
    return {
      ...access,
      userId: payload.userId,
      name: payload.name,
      image: payload.image,
    };
  }

  function logUnlessForbidden(message: string, error: unknown) {
    if (!(error instanceof RealtimeAuthorizationError)) {
      logger.error(message, error);
    }
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

      const context = await buildContext(token, documentName);
      connectionConfig.readOnly = context.readOnly;

      return context;
    },
    onTokenSync: async ({ token, documentName, connection }) => {
      connection.context = await buildContext(token, documentName);
      connection.readOnly = connection.context.readOnly;

      return connection.context;
    },
    beforeHandleAwareness: async ({ states, context, documentName }) => {
      if (!context) return;

      try {
        await authorizeRoom(context.userId, documentName);
      } catch (error) {
        states.clear();
        logUnlessForbidden(
          "Lipi realtime awareness authorization failed",
          error
        );
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
        logUnlessForbidden(
          "Lipi realtime workspace notification failed",
          error
        );
      }
    },
    onListen: async ({ port: listeningPort }) => {
      logger.info(`Lipi realtime listening on ${listeningPort}`);
    },
  });
}
