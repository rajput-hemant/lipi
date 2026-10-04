# Image and logo uploads

Status: DRAFT, not live-verified. Last live proof: none.

UploadThing endpoints `documentImage`, `coverBanner`, `workspaceLogo` (`app/api/uploadthing/core.ts`) used by page cover/icon and the workspace logo field (`placeholder="https://... or upload an image"`).

## Sub-features

- [ ] Unauthenticated upload request is rejected.
- [ ] Viewer cannot upload a document image; editor can; only owner/`workspace:settings` can upload a logo.
- [ ] URL-based cover/logo works without UploadThing.
- [ ] Binary delivery to UploadThing (needs `UPLOADTHING_TOKEN`) is out of scope locally.

## How to get to it (user POV)

Page header cover control; Settings, General, Logo.

## Driving it with the browser skill (pending)

1. Without credentials, only the URL-field path and permission-denied paths can be driven.
2. The e2e fixtures stub `/api/uploadthing` to `[]` (`tests/e2e/fixtures.ts`); a verify run should not stub silently, and must note when UploadThing env is absent.
3. Evidence: HTTP responses from `/api/uploadthing`, console output.

## Gotchas

- No real credentials: live upload remains a GAP.
- `.env.example` lists `UPLOADTHING_TOKEN` and optional legacy variables (LIP-V018 fixed). Binary delivery remains unverified.
