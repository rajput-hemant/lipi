import { expect, test } from "./fixtures";
import { createWorkspace, signUp, uniqueUser } from "./helpers/auth";

test.describe("Stripe checkout redirect", () => {
  test("redirects to Stripe checkout (mocked billing API, no live payment)", async ({
    page,
  }) => {
    const user = uniqueUser("billing");
    await signUp(page, user);
    await createWorkspace(page, "Billing Workspace");

    const checkoutUrl =
      "https://checkout.stripe.com/c/pay/cs_test_e2e_mock#e2e-no-payment";

    await page.route("**/api/stripe/checkout", (route) =>
      route.fulfill({ json: { url: checkoutUrl } })
    );
    // Keep the redirect offline so CI never reaches the real Stripe host.
    await page.route("https://checkout.stripe.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "" })
    );

    await page.goto("/pricing");

    await page.getByRole("button", { name: "Go Pro" }).click();

    await page.waitForURL(checkoutUrl);
    expect(page.url()).toBe(checkoutUrl);
  });
});
