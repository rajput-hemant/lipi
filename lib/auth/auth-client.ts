"use client";

import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export function createAuthClient(options: { baseURL?: string } = {}) {
  return createBetterAuthClient({
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
  });
}

export const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  changePassword,
  requestPasswordReset,
  resetPassword,
} = authClient;
