import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

export function getSafeRedirectPath(
  from: string | null | undefined,
  fallback = DEFAULT_LOGIN_REDIRECT,
) {
  if (!from) return fallback;

  try {
    const decoded = decodeURIComponent(from);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
