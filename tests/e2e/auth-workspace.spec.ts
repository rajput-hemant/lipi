import { expect, test } from "./fixtures";
import { createWorkspace, logIn, signUp, uniqueUser } from "./helpers/auth";

test.describe("authentication and workspace", () => {
  test("signs up, logs out, logs in, and creates a workspace", async ({
    page,
  }) => {
    const user = uniqueUser("auth");
    await signUp(page, user);

    await page.context().clearCookies();
    await logIn(page, user);

    await createWorkspace(page, "E2E Notes");
    await expect(page.getByText("Pages", { exact: true })).toBeVisible();
  });
});
