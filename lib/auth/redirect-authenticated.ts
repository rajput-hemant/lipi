import { redirect } from "next/navigation";

import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

import { getCurrentUser } from "@/lib/auth";
import { getSafeRedirectPath } from "./redirect";

export async function redirectIfAuthenticated(from?: string | null) {
  const user = await getCurrentUser();
  if (!user) return;

  redirect(getSafeRedirectPath(from, DEFAULT_LOGIN_REDIRECT));
}
