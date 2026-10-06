import type { TestUser } from "./helpers/auth";
import type { Browser, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { createWorkspace, signUp, uniqueUser } from "./helpers/auth";
import { getWorkspaceInviteToken } from "./helpers/db";
import {
  closeWorkspaceSettingsIfOpen,
  createRootPage,
  inviteMember,
  openWorkspaceSettings,
} from "./helpers/workspace";

async function joinAs(
  browser: Browser,
  user: TestUser,
  workspaceUrl: string
): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signUp(page, user);
  const token = await getWorkspaceInviteToken(user.email);
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(/\/dashboard\/[0-9a-f-]{36}/, {
    timeout: 60_000,
  });
  await page.goto(workspaceUrl);
  return page;
}

async function expectNoOwnerControls(page: Page) {
  await openWorkspaceSettings(page);
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await expect(page.getByLabel("Invite by email")).toHaveCount(0);
  await expect(page.getByText("Danger zone")).toHaveCount(0);
  await expect(page.getByLabel("Transfer ownership")).toHaveCount(0);
  await closeWorkspaceSettingsIfOpen(page);
}

test.describe("role-based access", () => {
  test("viewer is read-only, editor cannot manage the workspace, anonymous is redirected", async ({
    browser,
    page,
  }) => {
    test.setTimeout(240_000);

    const owner = uniqueUser("role-owner");
    const editor = uniqueUser("role-editor");
    const viewer = uniqueUser("role-viewer");
    const contexts = [page.context()];

    try {
      await signUp(page, owner);
      await createWorkspace(page, "Roles Workspace");
      const workspaceUrl = page.url();
      await createRootPage(page, "Role Doc");

      await openWorkspaceSettings(page);
      await expect(page.getByLabel("Invite by email")).toBeVisible();
      await expect(page.getByText("Danger zone")).toBeVisible();
      await closeWorkspaceSettingsIfOpen(page);

      await inviteMember(page, editor.email, "editor");
      await inviteMember(page, viewer.email, "viewer");

      const editorPage = await joinAs(browser, editor, workspaceUrl);
      const viewerPage = await joinAs(browser, viewer, workspaceUrl);
      contexts.push(editorPage.context(), viewerPage.context());

      await expect(
        editorPage.getByRole("button", { name: "New page" })
      ).toBeVisible();
      await editorPage
        .getByRole("link", { name: "Role Doc", exact: true })
        .click({ button: "right" });
      await expect(
        editorPage.getByRole("menuitem", { name: "Move to trash" })
      ).toBeVisible();
      await editorPage.keyboard.press("Escape");
      await expectNoOwnerControls(editorPage);

      await expect(viewerPage.getByText("View only").first()).toBeVisible();
      await expect(
        viewerPage.getByRole("button", { name: "New page" })
      ).toHaveCount(0);
      await viewerPage
        .getByRole("link", { name: "Role Doc", exact: true })
        .click({ button: "right" });
      await expect(viewerPage.getByRole("menuitem")).toHaveCount(0);
      await expectNoOwnerControls(viewerPage);

      const anonymous = await browser.newContext();
      contexts.push(anonymous);
      const anonymousPage = await anonymous.newPage();
      await anonymousPage.goto(workspaceUrl);
      await expect(anonymousPage).toHaveURL(/\/login/, { timeout: 30_000 });
    } finally {
      await Promise.all(contexts.slice(1).map((context) => context.close()));
    }
  });
});
