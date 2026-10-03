// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { Trash } from "./trash";
import { Dialog } from "./ui/dialog";
import { TooltipProvider } from "./ui/tooltip";

const { restoreDocument, deleteDocumentPermanently } = vi.hoisted(() => ({
  restoreDocument: vi.fn(async () => undefined),
  deleteDocumentPermanently: vi.fn(async () => undefined),
}));

vi.mock("@/lib/db/queries", () => ({
  restoreDocument,
  deleteDocumentPermanently,
}));
vi.mock("sonner", () => ({
  toast: { promise: vi.fn(), error: vi.fn() },
}));

function doc(id: string, title: string) {
  return {
    id,
    workspaceId: "w",
    parentId: null,
    title,
    icon: "",
    bannerUrl: null,
    content: null,
    inTrash: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function render(
  documents = [doc("a", "Alpha"), doc("b", "Beta")],
  role: "owner" | "editor" | "viewer" = "owner"
) {
  const store = createAppStore({ user: null, documents, role });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <AppStateContext.Provider value={store}>
        <TooltipProvider>
          <Dialog open>
            <Trash />
          </Dialog>
        </TooltipProvider>
      </AppStateContext.Provider>
    );
  });
  return { store, root, container };
}

const byLabel = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
const byText = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === text
  );

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("Trash", () => {
  it("shows the empty state", () => {
    render([]);
    expect(document.body.textContent).toContain("Nothing in the trash");
  });

  it("truncates long page titles with an ellipsis", () => {
    render([doc("a", "A very long page title ".repeat(10))]);
    const title = document.querySelector("li span.truncate");
    expect(title?.textContent).toContain("A very long page title");
  });

  it("labels row controls by page title", () => {
    render();
    expect(byLabel("Restore Alpha")).toBeTruthy();
    expect(byLabel("Delete Beta permanently")).toBeTruthy();
  });

  it("dispatches restore and updates the store", async () => {
    const { store } = render();
    await act(async () => byLabel("Restore Alpha").click());
    expect(restoreDocument).toHaveBeenCalledWith("a");
    expect(store.documents.find((d) => d.id === "a")?.inTrash).toBe(false);
  });

  it("requires confirmation before permanent delete", async () => {
    const { store } = render();
    await act(async () => byLabel("Delete Alpha permanently").click());
    expect(deleteDocumentPermanently).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Delete permanently?");

    await act(async () => byText("Cancel")!.click());
    expect(deleteDocumentPermanently).not.toHaveBeenCalled();
    expect(store.documents).toHaveLength(2);

    await act(async () => byLabel("Delete Alpha permanently").click());
    await act(async () => byText("Delete permanently")!.click());
    expect(deleteDocumentPermanently).toHaveBeenCalledWith("a");
    expect(store.documents.map((d) => d.id)).toEqual(["b"]);
  });

  it("hides restore and delete controls for viewers", () => {
    render(undefined, "viewer");
    expect(document.body.textContent).toContain("Alpha");
    expect(document.body.textContent).toContain("view-only access");
    expect(document.querySelector('button[aria-label^="Restore"]')).toBeNull();
    expect(
      document.querySelector('button[aria-label$="permanently"]')
    ).toBeNull();
  });

  it("keeps restore and delete controls for editors", () => {
    render(undefined, "editor");
    expect(byLabel("Restore Alpha")).toBeTruthy();
  });
});
