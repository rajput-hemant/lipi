import { redirect } from "next/navigation";

import { authRoutes, DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

import { getCurrentUser } from "@/lib/auth";
import { getSafeRedirectPath } from "./redirect";
import { resolveAuthBaseURL } from "./resolve-auth-base-url";

export function resolveAuthenticatedRedirect(
  from: string | null | undefined,
  currentPath?: string,
) {
  let destination = getSafeRedirectPath(
    from,
    DEFAULT_LOGIN_REDIRECT,
    resolveAuthBaseURL(),
  );

  const destinationPath = destination.split("?")[0];

  if (currentPath && destinationPath === currentPath) {
    destination = DEFAULT_LOGIN_REDIRECT;
  } else if (authRoutes.includes(destinationPath)) {
    destination = DEFAULT_LOGIN_REDIRECT;
  }

  return destination;
}

export async function redirectIfAuthenticated(
  from?: string | null,
  currentPath?: string,
) {
  const user = await getCurrentUser();
  if (!user) return;

  redirect(resolveAuthenticatedRedirect(from, currentPath));
}
