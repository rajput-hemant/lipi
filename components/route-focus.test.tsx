// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { Root } from "react-dom/client";

import { RouteFocus } from "./route-focus";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

let root: Root | undefined;

async function navigate(path: string) {
  usePathname.mockReturnValue(path);
  await act(async () => root!.render(<RouteFocus />));
}

function byId(id: string) {
  return document.getElementById(id)!;
}

function setup(inner = "") {
  document.body.innerHTML = `<a id="link" href="/x">x</a><input id="field" /><main id="main-content" tabindex="-1">${inner}</main><div id="host"></div>`;
  root = createRoot(byId("host"));
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("RouteFocus", () => {
  it("does not move focus on first load", async () => {
    setup();
    byId("link").focus();
    await navigate("/a");
    expect(document.activeElement?.id).toBe("link");
  });

  it("focuses main without scrolling when the pathname changes", async () => {
    setup();
    const focus = vi.spyOn(byId("main-content"), "focus");
    await navigate("/a");
    byId("link").focus();
    await navigate("/b");
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(byId("main-content"));
  });

  it("does not refocus when the pathname is unchanged", async () => {
    setup();
    await navigate("/a");
    byId("link").focus();
    await navigate("/a");
    expect(document.activeElement?.id).toBe("link");
  });

  it("skips when focus is already inside main", async () => {
    setup('<button id="inner">b</button>');
    await navigate("/a");
    byId("inner").focus();
    const focus = vi.spyOn(byId("main-content"), "focus");
    await navigate("/b");
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe("inner");
  });

  it("skips while the user is typing", async () => {
    setup();
    await navigate("/a");
    byId("field").focus();
    await navigate("/b");
    expect(document.activeElement?.id).toBe("field");
  });

  it("does nothing when there is no main landmark", async () => {
    setup();
    byId("main-content").remove();
    await navigate("/a");
    byId("link").focus();
    await navigate("/b");
    expect(document.activeElement?.id).toBe("link");
  });
});
