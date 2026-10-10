import * as z from "zod";

// Must run before any schema is created: Zod caches its `new Function` probe, which a CSP without `unsafe-eval` reports.
z.config({ jitless: true });
