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

import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { hideNavigationMenuTriggerIndicator } from "@/lib/shadcn-call-site";
import {
  VerticalNavigationMenu,
  verticalNavigationMenuListClassName,
} from "./vertical-navigation-menu";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("vertical navigation menu", () => {
  it("opens the focused item with the vertical keyboard key and positions it beside the rail", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() =>
      root.render(
        <VerticalNavigationMenu>
          <NavigationMenuList className={verticalNavigationMenuListClassName}>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={hideNavigationMenuTriggerIndicator}
              >
                Workspaces
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="/dashboard">
                  Dashboard
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </VerticalNavigationMenu>
      )
    );

    const trigger = container.querySelector("button");
    expect(
      container
        .querySelector('[data-slot="navigation-menu"]')
        ?.getAttribute("data-orientation")
    ).toBe("vertical");
    expect(
      container
        .querySelector('[data-slot="navigation-menu-list"]')
        ?.className.includes(
          "group-data-[orientation=vertical]/navigation-menu:flex-col"
        )
    ).toBe(true);

    await act(async () => {
      trigger?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    });

    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector('[data-side="right"]')).toBeTruthy();
  });
});
