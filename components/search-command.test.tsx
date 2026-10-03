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

import { SearchCommand } from "./search-command";

const mockSearchDocuments = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/ws-123/doc-456",
}));

vi.mock("@/lib/db/queries", () => ({
  searchDocumentsInWorkspace: (...args: unknown[]) =>
    mockSearchDocuments(...args),
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("SearchCommand", () => {
  it("renders the trigger button with search shortcut", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });

    const trigger = container.querySelector("button");
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain("Search");
    expect(trigger?.textContent).toContain("⌘K");
  });

  it("surfaces error state when search query throws an error", async () => {
    vi.useFakeTimers();
    mockSearchDocuments.mockRejectedValue(new Error("Database offline"));

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });

    const trigger = container.querySelector("button");
    act(() => {
      trigger?.click();
    });

    // Advance debounce timer
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain(
      "Failed to search documents. Please try again."
    );
    expect(document.body.textContent).not.toContain(
      "No pages in this workspace yet."
    );
  });

  it("shows empty state when search returns no documents successfully", async () => {
    vi.useFakeTimers();
    mockSearchDocuments.mockResolvedValue([]);

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });

    const trigger = container.querySelector("button");
    act(() => {
      trigger?.click();
    });

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.body.textContent).toContain(
      "No pages in this workspace yet."
    );
    const empty = document.querySelector('[data-slot="combobox-empty"]');
    expect(empty?.classList.contains("flex")).toBe(true);
  });

  it("restores focus to trigger button when closed", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });

    const trigger = container.querySelector("button");
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.focus();
      trigger?.click();
    });

    // Verify dialog opened
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy();

    // Close via escape on the active input
    const input = document.querySelector('input[role="combobox"]');
    expect(input).toBeTruthy();

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      });
      input?.dispatchEvent(event);
    });

    // Wait for rAF
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(document.activeElement).toBe(trigger);
  });
});
