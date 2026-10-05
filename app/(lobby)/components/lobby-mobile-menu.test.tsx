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

import { LobbyMobileMenu } from "./lobby-mobile-menu";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("LobbyMobileMenu", () => {
  it("renders a labelled trigger that is hidden from md up", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<LobbyMobileMenu />);
    });

    const trigger = container.querySelector(
      'button[aria-label="Open navigation menu"]'
    );
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-label")).toBe("Open navigation menu");
    expect(trigger?.className).toContain("md:hidden");
  });
});
