import { expect, test } from "./fixtures";
import { createWorkspace, signUp, uniqueUser } from "./helpers/auth";

test.describe("Stripe checkout redirect", () => {
  test("attempts redirect to Stripe checkout (mocked billing API, no live payment)", async ({
    page,
  }) => {
    const user = uniqueUser("billing");
    await signUp(page, user);
    await createWorkspace(page, "Billing Workspace");

    const checkoutUrl =
      "https://checkout.stripe.com/c/pay/cs_test_e2e_mock#e2e-no-payment";

    await page.addInitScript((mockUrl) => {
      window.__e2eCheckoutRedirect = null;
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const href =
          typeof input === "string" ? input
          : input instanceof URL ? input.href
          : input.url;
        if (href.includes("/api/stripe/checkout") && init?.method === "POST") {
          window.__e2eCheckoutRedirect = mockUrl;
          return new Response(JSON.stringify({ url: mockUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(input, init);
      };
      window.location.assign = (target: string | URL) => {
        window.__e2eCheckoutRedirect = String(target);
      };
    }, checkoutUrl);

    await page.goto("/pricing");

    await page.getByRole("button", { name: "Go Pro" }).click();

    await expect
      .poll(async () =>
        page.evaluate(() => window.__e2eCheckoutRedirect ?? null)
      )
      .toBe(checkoutUrl);
  });
});

declare global {
  interface Window {
    __e2eCheckoutRedirect?: string | null;
  }
}
