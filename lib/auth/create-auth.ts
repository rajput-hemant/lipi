import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import type { BetterAuthPlugin } from "better-auth";
import type { db } from "@/lib/db";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { resolveAuthRateLimitEnabled } from "./auth-rate-limit";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from "./constants";
import { credentialAccountWhere } from "./credential-account";
import { resolveAuthBaseURL } from "./resolve-auth-base-url";

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

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
    baseURL: resolveAuthBaseURL(),
    rateLimit: {
      enabled: resolveAuthRateLimitEnabled(),
    },
    database: drizzleAdapter(database, {
      provider: "pg",
      usePlural: false,
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
      additionalFields: {
        username: {
          type: "string",
          required: false,
          unique: true,
        },
        displayUsername: {
          type: "string",
          required: false,
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
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
      cookieCache: {
        enabled: false,
      },
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
            const patch: Record<string, unknown> = {};
            if (user.name !== undefined) patch.name = user.name;
            if (user.username !== undefined) patch.username = user.username;
            if (Object.keys(patch).length > 0) {
              await database
                .update(users)
                .set(patch)
                .where(eq(users.id, user.id as string));
            }
            await mirrorAccountPassword(user.id as string);
          },
        },
        update: {
          after: async (user) => {
            const patch: Record<string, unknown> = {};
            if (user.name !== undefined) patch.name = user.name;
            if (user.username !== undefined) patch.username = user.username;
            if (Object.keys(patch).length > 0) {
              await database
                .update(users)
                .set(patch)
                .where(eq(users.id, user.id as string));
            }
          },
        },
      },
      account: {
        create: {
          after: async (account) => {
            if (account.password) {
              await mirrorAccountPassword(account.userId as string);
            }
          },
        },
        update: {
          after: async (account) => {
            if (account.password) {
              await mirrorAccountPassword(account.userId as string);
            }
          },
        },
      },
    },

    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      database: {
        generateId: "uuid",
      },
      crossSubDomainCookies: {
        enabled: false,
      },
    },

    plugins: [
      username({
        minUsernameLength: USERNAME_MIN_LENGTH,
        maxUsernameLength: USERNAME_MAX_LENGTH,
        usernameValidator: (value) => USERNAME_REGEX.test(value),
      }),
      ...(options.plugins ?? []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
