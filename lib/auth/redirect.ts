import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

const UNSAFE_PATH_PATTERN = /[\\\u0000-\u001f\u007f]/;
const ENCODED_BACKSLASH_PATTERN = /%5[cC]/;

function decodeRedirectParam(from: string) {
  let decoded = from;

  for (let i = 0; i < 4; i++) {
    if (ENCODED_BACKSLASH_PATTERN.test(decoded)) {
      throw new Error("Invalid redirect path");
    }

    if (!/%[0-9A-Fa-f]{2}/.test(decoded)) break;

    const next = decodeURIComponent(decoded);
    if (
      ENCODED_BACKSLASH_PATTERN.test(next) ||
      UNSAFE_PATH_PATTERN.test(next)
    ) {
      throw new Error("Invalid redirect path");
    }

    decoded = next;
  }

  return decoded;
}

export function isSafeRelativeRedirectPath(path: string, baseURL?: string) {
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
  baseURL?: string
) {
  if (!from) return fallback;

  try {
    const decoded = decodeRedirectParam(from);
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
