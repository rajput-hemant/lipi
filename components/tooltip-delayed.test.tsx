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

import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipDelayed } from "./tooltip-delayed";

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-slot="tooltip">{children}</div>
  ),
  TooltipProvider: ({
    delay,
    children,
  }: {
    delay?: number;
    children: React.ReactNode;
  }) => (
    <div data-slot="tooltip-provider" data-delay={delay}>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("TooltipDelayed", () => {
  it("wraps the tooltip with a provider delay matching auth form tooltips", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() =>
      root.render(
        <TooltipDelayed delay={150}>
          <TooltipTrigger>Password</TooltipTrigger>
          <TooltipContent>Requirements</TooltipContent>
        </TooltipDelayed>
      )
    );

    const provider = container.querySelector('[data-slot="tooltip-provider"]');
    expect(provider?.getAttribute("data-delay")).toBe("150");
  });
});
