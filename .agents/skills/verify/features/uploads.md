# Image and logo uploads

Status: PARTIAL live proof (no UploadThing credentials: rejection paths and the URL logo path only). Last live proof: 2026-10-10 @ 37e892b, production build, evidence [local-session-r4-vskill-2026-10-10.md](../../../../docs/verification/local-session-r4-vskill-2026-10-10.md); the viewer and non-member 403 rows come from [local-session-r4-ui-2026-10-10.md](../../../../docs/verification/local-session-r4-ui-2026-10-10.md) and were not re-driven here.

UploadThing endpoints `documentImage`, `coverBanner`, `workspaceLogo` (`app/api/uploadthing/core.ts`) used by page cover/icon and the workspace logo field (`placeholder="https://... or upload an image"`).

## Sub-features

- [x] Unauthenticated upload request is rejected. - live: `POST /api/uploadthing?actionType=upload&slug=documentImage` with a JSON body (`files`, `input.workspaceId`) and no cookie returned 403 `{"message":"Unauthorized"}`. The same POST with no body returns 400, not 403.
- [ ] Viewer cannot upload a document image; editor can; only owner/`workspace:settings` can upload a logo. - partial: viewer and non-member 403 `Forbidden: insufficient workspace permissions` (r4-ui doc only); the signed-in owner reaches the missing-token stage, 500 `Missing token...` (re-driven here with an in-page `fetch`); editor allowed and owner-only logo NOT exercised.
- [x] URL-based cover/logo works without UploadThing. - live: Settings, `Logo` textbox, `https://example.com/logo.png`, `Save changes`, toast `Workspace updated`, `lipi_workspaces.logo` holds the URL. The page cover popover offers preset gradients and `None` only (no custom URL input).
- [ ] Binary delivery to UploadThing (needs `UPLOADTHING_TOKEN`) is out of scope locally.

## How to get to it (user POV)

Page header cover control; Settings, General, Logo.

## Driving it with the browser skill (pending)

1. Without credentials, only the URL-field path and permission-denied paths can be driven.
2. The e2e fixtures stub `/api/uploadthing` to `[]` (`tests/e2e/fixtures.ts`); a verify run should not stub silently, and must note when UploadThing env is absent.
3. Evidence: HTTP responses from `/api/uploadthing`, console output.

## Gotchas

- Client size limits and copy: 4MB documentImage/coverBanner, 2MB workspaceLogo (`File is too large (max 4MB)`, `Logo file is too large (max 2MB)`); the editor image block also uses `documentImage`. Not exercised.
- The logo avatar loads the URL from the browser, so an unresolvable host adds `net::ERR_NAME_NOT_RESOLVED` console errors; they are not product errors.

- No real credentials: live upload remains a GAP.
- `.env.example` lists `UPLOADTHING_TOKEN` and optional legacy variables (LIP-V018 fixed). Binary delivery remains unverified.
