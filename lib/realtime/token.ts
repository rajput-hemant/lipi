import { createHmac, timingSafeEqual } from "node:crypto";
import * as z from "zod";

const TOKEN_TTL_SECONDS = 60;
const tokenPayloadSchema = z.object({
  userId: z.uuid(),
  roomName: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  image: z.string().max(2048).nullable(),
  expiresAt: z.number().int().positive(),
});

export type RealtimeTokenPayload = z.infer<typeof tokenPayloadSchema>;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function getRealtimeTokenSecret() {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;

  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Realtime authentication secret is missing");
  }

  return "lipi-realtime-development-secret";
}

export function createRealtimeToken(
  input: Omit<RealtimeTokenPayload, "expiresAt">,
  secret: string,
  now = Date.now()
) {
  const payload = Buffer.from(
    JSON.stringify({
      ...input,
      expiresAt: Math.floor(now / 1000) + TOKEN_TTL_SECONDS,
    })
  ).toString("base64url");

  return `${payload}.${signature(payload, secret)}`;
}

export function verifyRealtimeToken(
  token: string,
  roomName: string,
  secret: string,
  now = Date.now()
): RealtimeTokenPayload | null {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;

  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(suppliedSignature);
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    const parsed = tokenPayloadSchema.safeParse(decoded);

    if (
      !parsed.success ||
      parsed.data.roomName !== roomName ||
      parsed.data.expiresAt <= Math.floor(now / 1000)
    ) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
