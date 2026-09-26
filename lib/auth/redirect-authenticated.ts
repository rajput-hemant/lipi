import { redirect } from "next/navigation";

import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

import { getCurrentUser } from "@/lib/auth";
import { getSafeRedirectPath } from "./redirect";
import { resolveAuthBaseURL } from "./resolve-auth-base-url";

export async function redirectIfAuthenticated(from?: string | null) {
  const user = await getCurrentUser();
  if (!user) return;

  redirect(
    getSafeRedirectPath(
      from,
      DEFAULT_LOGIN_REDIRECT,
      resolveAuthBaseURL(),
    ),
  );
}
