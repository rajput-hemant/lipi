import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const fixtureSchema = z.object({
  database: z.object({ url: z.string().url() }),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    username: z.string().optional(),
    displayUsername: z.string().optional(),
    emailVerified: z.boolean().default(true),
  }),
});

export type LocalDevFixture = z.infer<typeof fixtureSchema>;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLoopbackDatabaseUrl(url: string | undefined) {
  if (!url) return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Local shared setup is opt-in: it only applies when LOCAL_DEV_CONFIG is set. */
export function isLocalDevConfigured(env: NodeJS.ProcessEnv = process.env) {
  return !!env.LOCAL_DEV_CONFIG;
}

/** Refuses anything that is not an explicit, loopback-only, non-production setup. */
export function assertLocalDevEnvironment(
  env: NodeJS.ProcessEnv = process.env
) {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run local-dev tooling with NODE_ENV=production"
    );
  }
  if (!env.LOCAL_DEV_CONFIG) {
    throw new Error(
      "LOCAL_DEV_CONFIG is not set. Point it at the shared fixture (Infinitunes local-dev/fixtures.json), see docs/local-development.md"
    );
  }
  if (!isLoopbackDatabaseUrl(env.DATABASE_URL)) {
    throw new Error(
      "Refusing to run: DATABASE_URL must point to localhost, 127.0.0.1 or ::1"
    );
  }
}

export function loadLocalDevFixture(
  env: NodeJS.ProcessEnv = process.env
): LocalDevFixture {
  const path = resolve(process.cwd(), env.LOCAL_DEV_CONFIG ?? "");
  return fixtureSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}
