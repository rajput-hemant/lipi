import { db } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createAuth } from "./auth/create-auth";
import type { SessionUser } from "./auth/types";

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!authInstance) {
    authInstance = createAuth(db, { plugins: [nextCookies()] });
  }
  return authInstance;
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    const instance = getAuth() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has: (_target, prop) => prop in (getAuth() as object),
});

export type { SessionUser as User } from "./auth/types";

function isMissingSecretError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "BetterAuthError" &&
    (error.message.includes("You are using the default secret") ||
      error.message.includes("BETTER_AUTH_SECRET is missing"))
  );
}

function isValidatedProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_ENV_VALIDATION !== "true"
  );
}

export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session ?? null;
  } catch (error) {
    if (!isMissingSecretError(error) || isValidatedProduction()) throw error;
    return null;
  }
});

export const getCurrentUser = cache(async (): Promise<SessionUser | undefined> => {
  const session = await getSession();
  if (!session?.user) return undefined;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
  };
});

export const checkAuth = async () => {
  const session = await getSession();
  if (!session) redirect("/login");
};
