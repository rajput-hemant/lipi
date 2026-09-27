import { Server } from "@hocuspocus/server";

import type { RealtimeContext } from "@/lib/realtime/block-quota";

import { db } from "@/lib/db";
import {
  authorizeRealtimeRoom,
  RealtimeAuthorizationError,
} from "@/lib/realtime/authorize-room";
import { RealtimeBlockQuotaGuard } from "@/lib/realtime/block-quota";
import { createRealtimePersistence } from "@/lib/realtime/persistence";
import { parseRealtimeRoomName } from "@/lib/realtime/rooms";
import {
  getRealtimeTokenSecret,
  verifyRealtimeToken,
} from "@/lib/realtime/token";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";

function getAllowedOrigins() {
  const configured = process.env.LIPI_REALTIME_ALLOWED_ORIGINS;
  const origins = configured
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins?.length)
    return new Set(origins.map((origin) => new URL(origin).origin));
  if (process.env.NODE_ENV === "production") {
    throw new Error("LIPI_REALTIME_ALLOWED_ORIGINS is required in production");
  }

  return new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
}

function getUserColor(userId: string) {
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

function makeContext(
  token: string,
  roomName: string,
  secret: string,
  now = Date.now()
) {
  const payload = verifyRealtimeToken(token, roomName, secret, now);
  if (!payload) throw new RealtimeAuthorizationError();

  return payload;
}

function getPort() {
  const port = Number(process.env.LIPI_REALTIME_PORT ?? "1234");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("LIPI_REALTIME_PORT must be a valid TCP port");
  }
  return port;
}

const secret = getRealtimeTokenSecret();
const allowedOrigins = getAllowedOrigins();
const quotaGuard = new RealtimeBlockQuotaGuard();

export const realtimeServer = new Server<RealtimeContext>({
  name: "lipi-realtime",
  address: process.env.LIPI_REALTIME_ADDRESS || "127.0.0.1",
  port: getPort(),
  debounce: 1000,
  maxDebounce: 5000,
  quiet: true,
  maxUnauthenticatedQueueSize: 1024 * 1024,
  maxUnauthenticatedQueueMessages: 100,
  maxPendingDocuments: 4,
  websocketOptions: { maxPayload: 1024 * 1024 },
  extensions: [createRealtimePersistence()],
  onAuthenticate: async ({
    documentName,
    requestHeaders,
    token,
    connectionConfig,
  }) => {
    const origin = requestHeaders.get("origin");
    if (!origin || !allowedOrigins.has(origin)) {
      throw new RealtimeAuthorizationError();
    }

    const payload = makeContext(token, documentName, secret);
    const access = await authorizeRealtimeRoom(payload.userId, documentName);
    const readOnly = access.readOnly;
    connectionConfig.readOnly = readOnly;

    return {
      ...access,
      userId: payload.userId,
      name: payload.name,
      image: payload.image,
      readOnly,
    };
  },
  onTokenSync: async ({ token, documentName, connection }) => {
    const payload = makeContext(token, documentName, secret);
    const access = await authorizeRealtimeRoom(payload.userId, documentName);
    const readOnly = access.readOnly;
    connection.readOnly = readOnly;
    connection.context = {
      ...access,
      userId: payload.userId,
      name: payload.name,
      image: payload.image,
      readOnly,
    };

    return connection.context;
  },
  beforeHandleAwareness: async ({ states, context, documentName }) => {
    if (!context) return;

    try {
      await authorizeRealtimeRoom(context.userId, documentName);
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
      color: getUserColor(context.userId),
    };

    for (const state of states.values()) {
      state.user = user;
    }
  },
  beforeSync: async (payload) => {
    const { context, connection, documentName } = payload;
    if (!context) throw new RealtimeAuthorizationError();

    const access = await authorizeRealtimeRoom(context.userId, documentName);
    connection.readOnly = access.readOnly;
    if (access.readOnly) return;

    await quotaGuard.beforeSync({
      ...payload,
      context: { ...context, ...access, readOnly: false },
    });
  },
  onChange: async ({ documentName, connection }) => {
    if (connection) quotaGuard.release(documentName, connection);
  },
  afterHandleMessage: async ({ documentName, connection }) => {
    quotaGuard.release(documentName, connection);
  },
  onStateless: async ({ connection, document, documentName, payload }) => {
    const room = parseRealtimeRoomName(documentName);
    if (room?.kind !== "workspace" || payload !== "pages:changed") return;

    try {
      const access = await authorizeRealtimeRoom(
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
    }
  },
  onListen: async ({ port }) => {
    console.info(`Lipi realtime listening on ${port}`);
  },
});

void realtimeServer.listen().catch((error: unknown) => {
  console.error("Lipi realtime server failed to start", error);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void realtimeServer
      .destroy()
      .then(() => db.$client.end({ timeout: 5 }))
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error: unknown) => {
        console.error("Lipi realtime shutdown failed", error);
        process.exitCode = 1;
      });
  });
}
