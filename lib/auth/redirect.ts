import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

const UNSAFE_PATH_PATTERN = /[\\\u0000-\u001f\u007f]/;

export function isSafeRelativeRedirectPath(
  path: string,
  baseURL?: string,
) {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (UNSAFE_PATH_PATTERN.test(path)) return false;

  if (baseURL) {
    try {
      const resolved = new URL(path, baseURL);
      const base = new URL(baseURL);
      if (resolved.origin !== base.origin) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export function getSafeRedirectPath(
  from: string | null | undefined,
  fallback = DEFAULT_LOGIN_REDIRECT,
  baseURL?: string,
) {
  if (!from) return fallback;

  try {
    const decoded = decodeURIComponent(from);
    if (!isSafeRelativeRedirectPath(decoded, baseURL)) {
      return fallback;
    }

    if (baseURL) {
      const resolved = new URL(decoded, baseURL);
      const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
      return path.length > 0 ? path : fallback;
    }

    return decoded;
  } catch {
    return fallback;
  }
}
