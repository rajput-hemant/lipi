import { assertNoConsoleIssues, expect, test, trackConsole } from "./fixtures";
import { createWorkspace, signUp, uniqueUser } from "./helpers/auth";
import { getWorkspaceInviteToken } from "./helpers/db";
import {
  closeWorkspaceSettingsIfOpen,
  createRootPage,
  expectEditorContains,
  inviteMember,
  openPageFromSidebar,
  typeInEditor,
  waitForEditableEditor,
  waitForViewOnlyEditor,
} from "./helpers/workspace";

test.describe("real-time collaboration", () => {
  test("syncs edits and presence; viewer cannot write", async ({ browser }) => {
    test.setTimeout(180_000);

    const owner = uniqueUser("owner");
    const editor = uniqueUser("editor");
    const viewer = uniqueUser("viewer");

    const ownerContext = await browser.newContext();
    const editorContext = await browser.newContext();
    const viewerContext = await browser.newContext();

    const ownerIssues: { type: string; text: string }[] = [];
    const editorIssues: { type: string; text: string }[] = [];
    const viewerIssues: { type: string; text: string }[] = [];

    const ownerPage = await ownerContext.newPage();
    const editorPage = await editorContext.newPage();
    const viewerPage = await viewerContext.newPage();

    const stopOwner = trackConsole(ownerPage, ownerIssues);
    const stopEditor = trackConsole(editorPage, editorIssues);
    const stopViewer = trackConsole(viewerPage, viewerIssues);

    try {
      await signUp(ownerPage, owner);
      await createWorkspace(ownerPage, "Collab Workspace");
      await createRootPage(ownerPage, "Shared Doc");
      await openPageFromSidebar(ownerPage, "Shared Doc");
      await waitForEditableEditor(ownerPage);

      await inviteMember(ownerPage, editor.email, "editor");
      await inviteMember(ownerPage, viewer.email, "viewer");
      await closeWorkspaceSettingsIfOpen(ownerPage);

      await signUp(editorPage, editor);
      const editorToken = await getWorkspaceInviteToken(editor.email);
      await editorPage.goto(`/invite/${editorToken}`);
      await expect(editorPage).toHaveURL(/\/dashboard\/[0-9a-f-]{36}/, {
        timeout: 60_000,
      });

      await signUp(viewerPage, viewer);
      const viewerToken = await getWorkspaceInviteToken(viewer.email);
      await viewerPage.goto(`/invite/${viewerToken}`);
      await expect(viewerPage).toHaveURL(/\/dashboard\/[0-9a-f-]{36}/, {
        timeout: 60_000,
      });

      await openPageFromSidebar(editorPage, "Shared Doc");
      await openPageFromSidebar(viewerPage, "Shared Doc");
      await waitForEditableEditor(editorPage);
      await waitForViewOnlyEditor(viewerPage);

      const livePhrase = `Live collab ${Date.now()}`;
      await typeInEditor(ownerPage, livePhrase);

      await expectEditorContains(editorPage, livePhrase);
      await expectEditorContains(viewerPage, livePhrase);

      await viewerPage.locator(".bn-editor").first().click();
      await viewerPage.keyboard.type("blocked viewer edit");
      await expect(viewerPage.locator(".bn-editor")).not.toContainText(
        "blocked viewer edit"
      );

      await expect(async () => {
        const count = await ownerPage
          .getByLabel("Page collaborators")
          .getByRole("listitem")
          .count();
        expect(count).toBeGreaterThanOrEqual(2);
      }).toPass({ timeout: 60_000 });
    } finally {
      stopOwner();
      stopEditor();
      stopViewer();
      assertNoConsoleIssues(ownerIssues);
      assertNoConsoleIssues(editorIssues);
      assertNoConsoleIssues(viewerIssues);
      await ownerContext.close();
      await editorContext.close();
      await viewerContext.close();
    }
  });
});
