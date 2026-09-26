import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

const UNSAFE_PATH_PATTERN = /[\\\u0000-\u001f\u007f]/;

export function isSafeRelativeRedirectPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (UNSAFE_PATH_PATTERN.test(path)) return false;
  return true;
}

export function getSafeRedirectPath(
  from: string | null | undefined,
  fallback = DEFAULT_LOGIN_REDIRECT,
) {
  if (!from) return fallback;

  try {
    const decoded = decodeURIComponent(from);
    if (isSafeRelativeRedirectPath(decoded)) {
      return decoded;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
