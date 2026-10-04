import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SidebarUser } from "./sidebar-user";

const mockPlan = vi.hoisted(() => ({ hasProEntitlement: false }));

vi.mock("@/hooks/use-app-state", () => ({
  useAppState: () => ({ user: { name: "Ada" } }),
}));
vi.mock("@/components/subscription-modal-provider", () => ({
  useSubscriptionModal: () => mockPlan,
}));
vi.mock("../sign-out", () => ({ SignOut: () => <button>Sign out</button> }));

describe("SidebarUser", () => {
  it("shows the free plan without a pro entitlement", () => {
    mockPlan.hasProEntitlement = false;
    const html = renderToStaticMarkup(<SidebarUser isCollapsed={false} />);

    expect(html).toContain("Free plan");
    expect(html).not.toContain("Pro plan");
  });

  it("shows the pro plan with a pro entitlement", () => {
    mockPlan.hasProEntitlement = true;
    const html = renderToStaticMarkup(<SidebarUser isCollapsed={false} />);

    expect(html).toContain("Pro plan");
    expect(html).not.toContain("Free plan");
  });
});
