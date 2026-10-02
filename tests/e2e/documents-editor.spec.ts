import { expect, test } from "./fixtures";
import {
  createWorkspace,
  signUp,
  uniqueUser,
  workspaceIdFromUrl,
} from "./helpers/auth";
import {
  createRootPage,
  createSubpage,
  expectEditorContains,
  openPageFromSidebar,
  typeInEditor,
} from "./helpers/workspace";

test.describe("documents and BlockNote editor", () => {
  test("creates nested pages and types in BlockNote", async ({ page }) => {
    const user = uniqueUser("docs");
    await signUp(page, user);
    await createWorkspace(page, "Doc Tree Workspace");

    const workspaceId = workspaceIdFromUrl(page);
    expect(workspaceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    await createRootPage(page, "Parent Page");
    await createSubpage(page, "Parent Page", "Child Page");
    await openPageFromSidebar(page, "Child Page");

    const phrase = `BlockNote e2e ${Date.now()}`;
    await typeInEditor(page, phrase);
    await expectEditorContains(page, phrase);
  });
});
