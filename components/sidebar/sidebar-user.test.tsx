import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SubscriptionModalProvider } from "../subscription-modal-provider";
import { SidebarUser } from "./sidebar-user";

vi.mock("@/hooks/use-app-state", () => ({
  useAppState: () => ({ user: { name: "Ada", image: null } }),
}));
vi.mock("../sign-out", () => ({ SignOut: () => <button>Sign out</button> }));
vi.mock("@/components/billing/stripe-checkout-button", () => ({
  StripeCheckoutButton: () => null,
}));

function render(props: { hasProEntitlement: boolean; hasErrored?: boolean }) {
  return renderToStaticMarkup(
    <SubscriptionModalProvider subscription={null} {...props}>
      <SidebarUser isCollapsed={false} />
    </SubscriptionModalProvider>
  );
}

describe("SidebarUser plan label", () => {
  it("shows the Pro plan for an entitled user", () => {
    const html = render({ hasProEntitlement: true });
    expect(html).toContain("Pro plan");
    expect(html).not.toContain("Free plan");
  });

  it("shows the Free plan without entitlement", () => {
    expect(render({ hasProEntitlement: false })).toContain("Free plan");
  });

  it("hides the plan when the subscription lookup failed", () => {
    const html = render({ hasProEntitlement: false, hasErrored: true });
    expect(html).not.toContain("Free plan");
    expect(html).not.toContain("Pro plan");
  });
});
