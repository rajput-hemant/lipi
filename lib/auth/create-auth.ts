import { after } from "next/server";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";

import type { BetterAuthPlugin } from "better-auth";
import type { db } from "@/lib/db";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { buildResetPasswordEmail } from "@/lib/email/reset-password-email";
import { sendEmail } from "@/lib/email/send-email";
import { env } from "@/lib/env";
import { resolveAuthRateLimitEnabled } from "./auth-rate-limit";
import { credentialAccountWhere } from "./credential-account";
import { resolveAuthBaseURL } from "./resolve-auth-base-url";

const RESET_PASSWORD_TOKEN_TTL_SECONDS = 60 * 60;

/** Runs after the response when inside a request, so timing does not reveal accounts. */
function runInBackground(task: Promise<unknown>) {
  try {
    after(task);
  } catch {
    void task;
  }
}

export function createAuth(
  database: typeof db,
  options: { plugins?: BetterAuthPlugin[] } = {}
) {
  async function mirrorAccountPassword(userId: string) {
    const account = await database.query.betterAuthAccounts.findFirst({
      where: credentialAccountWhere(userId),
    });

    if (account?.password) {
      await database
        .update(users)
        .set({ password: account.password })
        .where(eq(users.id, userId));
    }
  }

  async function syncUserName(user: { id: unknown; name?: unknown }) {
    if (user.name === undefined) return;
    await database
      .update(users)
      .set({ name: user.name as string })
      .where(eq(users.id, user.id as string));
  }

  async function mirrorIfPassword(account: {
    userId: unknown;
    password?: unknown;
  }) {
    if (account.password) await mirrorAccountPassword(account.userId as string);
  }

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
    baseURL: resolveAuthBaseURL(),
    rateLimit: {
      enabled: resolveAuthRateLimitEnabled(),
    },
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        user: users,
        account: betterAuthAccounts,
        session: betterAuthSessions,
        verification: betterAuthVerifications,
      },
    }),

    user: {
      fields: {
        name: "betterAuthName",
        emailVerified: "emailVerifiedBoolean",
      },
    },

    emailAndPassword: {
      enabled: true,
      resetPasswordTokenExpiresIn: RESET_PASSWORD_TOKEN_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        sendEmail({
          to: user.email,
          ...buildResetPasswordEmail(
            url,
            RESET_PASSWORD_TOKEN_TTL_SECONDS / 60
          ),
        }),
      password: {
        hash: async (password) => hash(password, 10),
        verify: async ({ password, hash: passwordHash }) =>
          compare(password, passwordHash),
      },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    account: {
      accountLinking: {
        enabled: false,
        disableImplicitLinking: true,
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await syncUserName(user);
            await mirrorAccountPassword(user.id as string);
          },
        },
        update: { after: syncUserName },
      },
      account: {
        create: { after: mirrorIfPassword },
        update: { after: mirrorIfPassword },
      },
    },

    // Relies on Better Auth defaults: httpOnly cookies, no cross-subdomain cookies,
    // no session cookie cache, no email verification requirement.
    advanced: {
      backgroundTasks: { handler: runInBackground },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
      },
      database: {
        generateId: "uuid",
      },
    },

    plugins: [...(options.plugins ?? [])],
  });
}

export type Auth = ReturnType<typeof createAuth>;
