import {
  test as base,
  expect,
  type ConsoleMessage,
  type Page,
} from "@playwright/test";

type ConsoleIssue = { type: string; text: string };

function attachConsoleGuard(page: Page, issues: ConsoleIssue[]) {
  const onConsole = (message: ConsoleMessage) => {
    const type = message.type();
    if (type !== "error" && type !== "warning") return;
    issues.push({ type, text: message.text() });
  };
  const onPageError = (error: Error) => {
    issues.push({ type: "pageerror", text: error.message });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  };
}

async function stubUploadthing(page: Page) {
  await page.route(/\/api\/uploadthing/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}

export const test = base.extend<{ assertCleanConsole: void }>({
  assertCleanConsole: [
    async ({ page }, use) => {
      const issues: ConsoleIssue[] = [];
      const detach = attachConsoleGuard(page, issues);
      await stubUploadthing(page);

      await use();
      detach();
      expect(
        issues,
        issues.map((issue) => `${issue.type}: ${issue.text}`).join("\n")
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export function trackConsole(page: Page, issues: ConsoleIssue[]) {
  void stubUploadthing(page);
  return attachConsoleGuard(page, issues);
}

export function assertNoConsoleIssues(issues: ConsoleIssue[]) {
  expect(
    issues,
    issues.map((issue) => `${issue.type}: ${issue.text}`).join("\n")
  ).toEqual([]);
}
