import type { Page } from "@playwright/test";

import { expect } from "../fixtures";

export async function createRootPage(page: Page, title: string) {
  await page.getByRole("button", { name: "New page" }).click();
  const input = page.getByRole("tree").locator("form input").first();
  await input.fill(title);
  await input.press("Enter");
  await expect(page.getByText("Page created.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("link", { name: title })).toBeVisible({
    timeout: 30_000,
  });
}

export async function openPageFromSidebar(page: Page, title: string) {
  await closeWorkspaceSettingsIfOpen(page);
  const href = await page.getByRole("link", { name: title }).getAttribute("href");
  if (!href) throw new Error(`Sidebar link not found for page "${title}"`);
  await page.goto(href);
  await expect(page).toHaveURL(/\/dashboard\/[0-9a-f-]{36}\/[0-9a-f-]{36}/, {
    timeout: 30_000,
  });
  await expect(page.getByText("Reconnecting to collaborators...")).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.getByText("Syncing page...")).toBeHidden({
    timeout: 60_000,
  });
}

export async function createSubpage(
  page: Page,
  parentTitle: string,
  childTitle: string
) {
  await page.getByRole("link", { name: parentTitle }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "New subpage" }).click();
  const childInput = page.getByRole("tree").locator("input").last();
  await expect(childInput).toBeVisible({ timeout: 15_000 });
  await childInput.fill(childTitle);
  await childInput.press("Enter");
  await expect(page.getByText("Page created.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("link", { name: childTitle })).toBeVisible({
    timeout: 30_000,
  });
}

export async function waitForEditableEditor(page: Page) {
  await expect(page.getByText("Syncing page...")).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.getByText("Reconnecting to collaborators...")).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.locator(".bn-editor").first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function waitForViewOnlyEditor(page: Page) {
  await expect(page.getByText("View only")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Reconnecting to collaborators...")).toBeHidden({
    timeout: 60_000,
  });
  await expect(page.locator(".bn-editor").first()).toBeVisible({
    timeout: 60_000,
  });
}

export async function typeInEditor(page: Page, text: string) {
  await waitForEditableEditor(page);
  const editor = page.locator(".bn-editor").first();
  await editor.click();
  await page.keyboard.type(text);
}

export async function expectEditorContains(page: Page, text: string) {
  await expect(page.locator(".bn-editor")).toContainText(text, {
    timeout: 60_000,
  });
}

export async function openWorkspaceSettings(page: Page) {
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
}

export async function closeWorkspaceSettingsIfOpen(page: Page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }
}

export async function inviteMember(
  page: Page,
  email: string,
  role: "editor" | "viewer"
) {
  await openWorkspaceSettings(page);
  await page.getByLabel("Invite by email").fill(email);
  await page
    .locator("form")
    .filter({ has: page.getByLabel("Invite by email") })
    .locator("select")
    .selectOption(role);
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("Invite created")).toBeVisible({
    timeout: 30_000,
  });
  await closeWorkspaceSettingsIfOpen(page);
}
