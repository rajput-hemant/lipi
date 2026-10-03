import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

// Resolve lazily so importing the route at build time does not construct auth.
export const { GET, POST } = toNextJsHandler((request) =>
  getAuth().handler(request)
);
