# Real-time collaboration

The BlockNote editor connects to the standalone Hocuspocus process through
`NEXT_PUBLIC_LIPI_REALTIME_URL`. Run it with `bun run realtime:start` on an
always-on Node.js 22 host. Configure the Next.js app and realtime process with
the same `DATABASE_URL` and `BETTER_AUTH_SECRET`. The
realtime process also needs `LIPI_REALTIME_ALLOWED_ORIGINS`, a comma-separated
list of exact browser origins. `LIPI_REALTIME_PORT` defaults to `1234` and
`LIPI_REALTIME_ADDRESS` defaults to `127.0.0.1`.

Next.js loads `.env.local`, but the standalone Node process does not load it
automatically. Export the variables into that process's environment, or start
it from the repository root with `node --env-file=.env.local realtime/bootstrap.mjs`.
Both processes must receive the same database URL and auth secret.

This implementation pins Hocuspocus server, provider, and database extension
to `4.7.0`, with Yjs `13.6.33`, `y-protocols` `1.0.7`, and `y-prosemirror`
`1.3.7`.

For a separate realtime host, terminate TLS at a WebSocket-capable reverse
proxy and set `NEXT_PUBLIC_LIPI_REALTIME_URL` to its `wss://` endpoint. Bind the
Node process to the proxy interface, and allow only the Lipi app origin. The
realtime process is not a Vercel function. Keep the database migration in the
normal Lipi migration path; it creates only `lipi_*` tables.

Yjs state in `lipi_realtime_documents.state` is the editing source of truth.
Hocuspocus stores the Yjs state and writes `documents.content` as a derived
BlockNote JSON snapshot in the same database transaction. Existing pages are
seeded into Yjs on first room load. Hocuspocus saves after a one-second debounce
and at most five seconds after ongoing edits. The old editor content action was
removed so another server path cannot overwrite the snapshot independently.
Document duplicate reads the same authoritative snapshot via
`loadAuthoritativeDocumentContentBySourceIds` so copies are not limited to
debounced `documents.content`.

The Better Auth session cookie is host-only (cross-subdomain cookies are off), so
a separate realtime hostname never receives it. That is why the app mints the
room token and the realtime process validates it instead of reading the cookie.
Keep that auth configuration stable across deployments.

The app checks the Better Auth session and workspace role before issuing a
60-second signed token scoped to one document or workspace room. The editor
refreshes that token every 30 seconds. The realtime process checks membership
again on synchronization, rejects missing, trashed, malformed, and forged
document rooms, and keeps viewers read-only. Workspace page-change messages
contain no page data; authorized clients refresh through the Lipi document
query.
