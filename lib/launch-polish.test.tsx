// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { Features } from "@/app/(lobby)/components/features";
import LobbyError from "@/app/(lobby)/error";
import LobbyLoading from "@/app/(lobby)/loading";
import DocumentNotFound from "@/app/dashboard/(workspaces)/[workspaceId]/not-found";
import DashboardError from "@/app/dashboard/error";
import DashboardLoading from "@/app/dashboard/loading";
import ErrorBoundary from "@/app/error";
import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PRICING_CARDS, PRICING_PLANS, USERS } from "@/lib/constants";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("Launch Polish Constants & Messaging", () => {
  it("contains authentic Lipi product messaging without dummy testing copy", () => {
    expect(USERS.length).toBeGreaterThan(0);

    for (const user of USERS) {
      expect(user.name).toBeTruthy();
      expect(user.message).toBeTruthy();
      // Must not contain legacy copy from unrelated testing tool
      expect(user.message.toLowerCase()).not.toContain("end-to-end testing");
      expect(user.message.toLowerCase()).not.toContain("testing bottlenecks");
      expect(user.message.toLowerCase()).not.toContain("qa and development");
    }

    // Must mention actual collaborative workspace features
    const allText = USERS.map((u) => u.message).join(" ");
    expect(allText).toMatch(
      /block editor|multiplayer|nested|workspace|slash commands/i
    );
  });

  it("defines accurate pricing plans and tier descriptions", () => {
    expect(PRICING_CARDS).toHaveLength(2);
    const free = PRICING_CARDS.find(
      (p) => p.planType === PRICING_PLANS.freeplan
    );
    const pro = PRICING_CARDS.find((p) => p.planType === PRICING_PLANS.proplan);

    expect(free).toBeDefined();
    expect(pro).toBeDefined();
    expect(free?.price).toBe("0");
    expect(pro?.price).toBe("499");
    expect(free?.description).toContain("Essential workspace");
  });
});

describe("SEO Metadata: robots & sitemap", () => {
  it("generates correct robots rules matching site config", () => {
    const res = robots();
    expect(res.rules).toBeDefined();
    expect(res.sitemap).toContain("/sitemap.xml");

    const rules = Array.isArray(res.rules) ? res.rules[0] : res.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(["/api/", "/dashboard/"]);
  });

  it("generates comprehensive sitemap with priority and routes", () => {
    const urls = sitemap();
    expect(urls.length).toBeGreaterThanOrEqual(5);

    const paths = urls.map((u) => u.url);
    expect(paths.some((p) => p.endsWith("/pricing"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/privacy"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/terms"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/login"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/signup"))).toBe(true);
  });
});

describe("Error Boundaries & Not Found Components", () => {
  it("renders root error boundary with retry trigger", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    const onRetry = vi.fn();
    act(() => {
      root.render(
        <ErrorBoundary
          error={new Error("Test failure")}
          reset={vi.fn()}
          retry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain("Something went wrong");
    const retryBtn = container.querySelector("button");
    expect(retryBtn).toBeTruthy();
    act(() => {
      retryBtn?.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders dashboard error boundary with retry trigger", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    const onReset = vi.fn();
    act(() => {
      root.render(
        <DashboardError
          error={new Error("Workspace load failed")}
          reset={onReset}
        />
      );
    });

    expect(container.textContent).toContain("Failed to load workspace");
    const retryBtn = container.querySelector("button");
    act(() => {
      retryBtn?.click();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("renders lobby error boundary with retry trigger", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    const onRetry = vi.fn();
    act(() => {
      root.render(
        <LobbyError
          error={new Error("Lobby load failed")}
          reset={vi.fn()}
          retry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain("Unable to display page");
    const retryBtn = container.querySelector("button");
    act(() => {
      retryBtn?.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders root 404 Not Found page", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<NotFound />);
    });

    expect(container.textContent).toContain("404");
    expect(container.textContent).toContain("Page not found");
  });

  it("renders document-level Not Found component", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<DocumentNotFound />);
    });

    expect(container.textContent).toContain("Document not found");
  });

  it("renders loading skeletons without errors", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(
        <>
          <Loading />
          <DashboardLoading />
          <LobbyLoading />
        </>
      );
    });

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0);
  });
});

describe("Composed Editor Product Visual", () => {
  it("renders rich editor product visual replacing placeholder in Features", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<Features />);
    });

    // Check placeholder is gone
    expect(container.textContent).not.toContain("A Planner goes here!");

    // Check editor visual components are present
    expect(container.textContent).toContain("Q3 Product Roadmap & Launch Plan");
    expect(container.textContent).toContain("Acme Workspace");
    expect(container.textContent).toContain("Target Deliverables");
    expect(container.textContent).toContain("Alex typing...");
  });
});
