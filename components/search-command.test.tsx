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
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dashboard/ws-123/doc-456",
}));

vi.mock("@/lib/db/actions/search", () => ({
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
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("type")).toBe("button");
    expect(trigger?.textContent).toContain("Search");
    expect(trigger?.textContent).toContain("⌘K");
  });

  it("keeps the shortcut hint readable instead of the low-contrast muted text", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });

    const hint = container.querySelector("kbd");
    expect(hint?.className).toContain("text-foreground");
    expect(hint?.className).not.toContain("text-muted-foreground");
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
    expect(alert).not.toBeNull();
    expect(alert?.getAttribute("role")).toBe("alert");
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
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("type")).toBe("button");

    act(() => {
      trigger?.focus();
      trigger?.click();
    });

    // Verify dialog opened
    expect(
      document.querySelector('[data-slot="dialog-content"]')
    ).not.toBeNull();
    const dialog = document.querySelector<HTMLElement>(
      '[data-slot="dialog-content"]'
    );
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("role")).toBe("dialog");

    // Close via escape on the active input
    const input = document.querySelector('input[role="combobox"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("role")).toBe("combobox");

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

  it("clears the query after Escape so a reopened dialog starts empty", async () => {
    mockSearchDocuments.mockResolvedValue([]);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    act(() => root.render(<SearchCommand />));
    const trigger = container.querySelector("button");

    act(() => trigger?.click());
    const input = () =>
      document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )!.set!;
      setValue.call(input(), "roadmap");
      input().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input().value).toBe("roadmap");

    act(() => {
      input().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    act(() => trigger?.click());
    expect(input().value).toBe("");
  });

  it("opens with Cmd+K and toggles closed on a second press", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<SearchCommand />);
    });
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();

    const press = () =>
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
            cancelable: true,
          })
        );
      });

    press();
    expect(
      document.querySelector('[data-slot="dialog-content"][data-open]')
    ).not.toBeNull();
    const openDialog = document.querySelector<HTMLElement>(
      '[data-slot="dialog-content"][data-open]'
    );
    expect(openDialog).not.toBeNull();
    expect(openDialog?.hasAttribute("data-open")).toBe(true);

    press();
    expect(
      document.querySelector('[data-slot="dialog-content"][data-open]')
    ).toBeNull();
  });

  it("navigates on select and restores focus to the element focused before Cmd+K", async () => {
    vi.useFakeTimers();
    mockSearchDocuments.mockResolvedValue([
      { id: "doc-9", title: "Roadmap", icon: null, snippet: "" },
    ]);

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(
        <>
          <button id="before">Before</button>
          <SearchCommand />
        </>
      );
    });

    const before = container.querySelector<HTMLElement>("#before");
    act(() => {
      before?.focus();
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
      vi.runAllTimers();
    });

    const item = document.querySelector<HTMLElement>(
      '[data-slot="combobox-item"]'
    );
    expect(item).not.toBeNull();
    expect(item?.textContent).toContain("Roadmap");

    act(() => {
      item?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/ws-123/doc-9");
    expect(
      document.querySelector('[data-slot="dialog-content"][data-open]')
    ).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });
    expect(document.activeElement).toBe(before);
  });

  it("clears the query when the dialog closes", async () => {
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

    const getInput = () =>
      document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(getInput(), "roadmap");
      getInput().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(getInput().value).toBe("roadmap");

    act(() => {
      getInput().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        })
      );
    });
    expect(
      document.querySelector('[data-slot="dialog-content"][data-open]')
    ).toBeNull();

    act(() => {
      trigger?.click();
    });
    expect(getInput().value).toBe("");
  });

  it("clears a stale error when the dialog closes", async () => {
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

    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(document.querySelector('[role="alert"]')).not.toBeNull();

    const getInput = () =>
      document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    act(() => {
      getInput().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        })
      );
    });
    expect(
      document.querySelector('[data-slot="dialog-content"][data-open]')
    ).toBeNull();

    mockSearchDocuments.mockResolvedValue([]);
    act(() => {
      trigger?.click();
    });
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});
