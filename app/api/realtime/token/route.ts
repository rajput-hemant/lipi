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

function normalizeLoopbackHost(host: string) {
  const hostname = host.split(":")[0]?.toLowerCase() ?? host;
  if (hostname === "localhost" || hostname === "127.0.0.1") return "127.0.0.1";
  return hostname;
}

function hostsMatch(leftHost: string, rightHost: string) {
  const left = leftHost.split(":");
  const right = rightHost.split(":");
  if (left[1] !== right[1]) return false;
  return (
    normalizeLoopbackHost(left[0] ?? "") ===
    normalizeLoopbackHost(right[0] ?? "")
  );
}

/** Whether `value` is on the request's protocol and host; null when unparsable. */
function matchesRequestHost(value: string, requestUrl: URL) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === requestUrl.protocol &&
      hostsMatch(parsed.host, requestUrl.host)
    );
  } catch {
    return null;
  }
}

function isSameOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    const matches = matchesRequestHost(origin, requestUrl);
    if (matches === null) return false;
    if (matches) return true;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin") return true;

  const referer = request.headers.get("referer");
  return !!referer && matchesRequestHost(referer, requestUrl) === true;
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
