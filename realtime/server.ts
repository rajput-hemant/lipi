import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { authorizeRealtimeRoom } from "@/lib/realtime/authorize-room";
import { RealtimeBlockQuotaGuard } from "@/lib/realtime/block-quota";
import { createRealtimePersistence } from "@/lib/realtime/persistence";
import { createRealtimeServer } from "@/lib/realtime/server-factory";
import { getRealtimeTokenSecret } from "@/lib/realtime/token";

// Standalone Node process (realtime/bootstrap.mjs): it reads process.env directly
// because it cannot load t3-env; the same variables are declared in lib/env.ts.
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

function getPort() {
  const port = Number(process.env.LIPI_REALTIME_PORT ?? "1234");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("LIPI_REALTIME_PORT must be a valid TCP port");
  }
  return port;
}

const quotaGuard = new RealtimeBlockQuotaGuard();

export const realtimeServer = createRealtimeServer({
  address: process.env.LIPI_REALTIME_ADDRESS || "127.0.0.1",
  allowedOrigins: getAllowedOrigins(),
  authorizeRoom: authorizeRealtimeRoom,
  extensions: [createRealtimePersistence()],
  port: getPort(),
  quotaGuard,
  secret: getRealtimeTokenSecret(),
});

void realtimeServer.listen().catch((error: unknown) => {
  logger.error("Lipi realtime server failed to start", error);
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
        logger.error("Lipi realtime shutdown failed", error);
        process.exitCode = 1;
      });
  });
}
