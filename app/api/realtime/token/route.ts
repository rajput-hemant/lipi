import * as z from "zod";

import { getAuth } from "@/lib/auth";
import {
  authorizeRealtimeRoom,
  RealtimeAuthorizationError,
} from "@/lib/realtime/authorize-room";
import {
  createRealtimeToken,
  getRealtimeTokenSecret,
} from "@/lib/realtime/token";

const requestSchema = z.object({ roomName: z.string().min(1).max(64) });

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid room" }, { status: 400 });
  }

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let access;
  try {
    access = await authorizeRealtimeRoom(session.user.id, parsed.data.roomName);
  } catch (error) {
    if (error instanceof RealtimeAuthorizationError) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    throw error;
  }

  const token = createRealtimeToken(
    {
      userId: session.user.id,
      roomName: access.roomName,
      name: (session.user.name || session.user.email).slice(0, 80),
      image: session.user.image?.slice(0, 2048) ?? null,
    },
    getRealtimeTokenSecret()
  );

  return Response.json(
    { token, readOnly: access.readOnly },
    { headers: { "Cache-Control": "no-store" } }
  );
}
