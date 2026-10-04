import * as z from "zod";

import { env } from "@/lib/env";

const tokenResponseSchema = z.object({
  token: z.string().min(1),
  readOnly: z.boolean(),
});

export function getRealtimeUrl() {
  const configured = env.NEXT_PUBLIC_LIPI_REALTIME_URL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return "ws://localhost:1234";
  return null;
}

export async function fetchRealtimeAccess(roomName: string) {
  const response = await fetch("/api/realtime/token", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName }),
  });

  if (!response.ok) throw new Error("Realtime authentication failed");

  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Realtime authentication failed");

  return parsed.data;
}
