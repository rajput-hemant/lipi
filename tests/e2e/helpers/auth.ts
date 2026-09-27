import type { Page } from "@playwright/test";

import { expect } from "../fixtures";

export type TestUser = {
  email: string;
  password: string;
};

const passwordPlaceholder = "••••••••••";

const AUTH_RATE_LIMIT_WINDOW_MS = 11_000;

let lastSignUpAt = 0;

async function paceSignUpForBetterAuthRateLimit() {
  const now = Date.now();
  const elapsed = now - lastSignUpAt;
  if (lastSignUpAt > 0 && elapsed < AUTH_RATE_LIMIT_WINDOW_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, AUTH_RATE_LIMIT_WINDOW_MS - elapsed)
    );
  }
  lastSignUpAt = Date.now();
}

export function uniqueUser(label: string): TestUser {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `e2e-${label}-${stamp}@example.com`,
    password: "E2e-test-password-9",
  };
}

export async function signUp(page: Page, user: TestUser) {
  await paceSignUpForBetterAuthRateLimit();
  await page.goto("/signup");
  await page.getByPlaceholder("you@domain.com").fill(user.email);
  await page.getByPlaceholder(passwordPlaceholder).first().fill(user.password);
  await page.getByPlaceholder(passwordPlaceholder).nth(1).fill(user.password);
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL(/\/dashboard(\/new-workspace|\/[0-9a-f-]{36})/, {
    timeout: 60_000,
  });
}

export async function logIn(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByPlaceholder("you@domain.com").fill(user.email);
  await page.getByPlaceholder(passwordPlaceholder).fill(user.password);
  await page.getByRole("button", { name: "Login with Email" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}

export async function createWorkspace(page: Page, name: string) {
  await page.goto("/dashboard/new-workspace");
  await page.getByPlaceholder("Workspace name").fill(name);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard\/[0-9a-f-]{36}/, {
    timeout: 60_000,
  });
}

export function workspaceIdFromUrl(page: Page) {
  const match = page.url().match(/\/dashboard\/([0-9a-f-]{36})/);
  if (!match?.[1]) throw new Error(`No workspace id in ${page.url()}`);
  return match[1];
}
