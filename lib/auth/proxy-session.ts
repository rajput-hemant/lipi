import type { NextRequest } from "next/server";

import { getAuth } from "@/lib/auth";

export async function hasValidProxySession(req: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: req.headers,
    });
    return !!session;
  } catch {
    return false;
  }
}
