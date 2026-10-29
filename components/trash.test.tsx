// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { MutationFailureError } from "@/lib/db/mutation-result";
import { Trash } from "./trash";
import { Dialog } from "./ui/dialog";
import { TooltipProvider } from "./ui/tooltip";

const { restoreDocument, deleteDocumentPermanently } = vi.hoisted(() => ({
  restoreDocument: vi.fn(async () => ({ ok: true, data: 1 })),
  deleteDocumentPermanently: vi.fn(async () => ({ ok: true, data: 1 })),
}));

vi.mock("@/lib/db/actions/document", () => ({
  restoreDocument,
  deleteDocumentPermanently,
}));
vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((pending: Promise<unknown>) => void pending.catch(() => {})),
    error: vi.fn(),
  },
}));

function doc(id: string, title: string) {
  return {
    id,
    workspaceId: "w",
    parentId: null as string | null,
    title,
    icon: "",
    bannerUrl: null,
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
// Dialog actions are portalled after the page's own buttons.
const lastByText = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")]
    .filter((b) => b.textContent === text)
    .at(-1);

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
    const restoreAlpha = byLabel("Restore Alpha");
    expect(restoreAlpha).not.toBeNull();
    expect(restoreAlpha).toBeInstanceOf(HTMLButtonElement);
    expect(restoreAlpha?.getAttribute("aria-label")).toBe("Restore Alpha");

    const deleteBeta = byLabel("Delete Beta permanently");
    expect(deleteBeta).not.toBeNull();
    expect(deleteBeta).toBeInstanceOf(HTMLButtonElement);
    expect(deleteBeta?.getAttribute("aria-label")).toBe(
      "Delete Beta permanently"
    );
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

  describe("empty trash", () => {
    it("confirms, then deletes every trashed root page once", async () => {
      const child = { ...doc("a1", "Child"), parentId: "a" };
      const { store } = render([doc("a", "Alpha"), child, doc("b", "Beta")]);
      await act(async () => byText("Empty trash")!.click());
      expect(deleteDocumentPermanently).not.toHaveBeenCalled();

      await act(async () => lastByText("Empty trash")!.click());
      expect(deleteDocumentPermanently).toHaveBeenCalledTimes(2);
      expect(deleteDocumentPermanently).toHaveBeenCalledWith("a");
      expect(deleteDocumentPermanently).toHaveBeenCalledWith("b");
      expect(toast.promise).toHaveBeenCalledTimes(1);
      expect(store.documents).toHaveLength(0);
    });

    it("brings back pages whose delete failed", async () => {
      deleteDocumentPermanently.mockResolvedValueOnce({
        ok: false,
        code: "INVALID",
        message: "nope",
      } as never);
      const { store } = render();
      await act(async () => byText("Empty trash")!.click());
      await act(async () => lastByText("Empty trash")!.click());
      await act(async () => {
        await vi.mocked(toast.promise).mock.calls[0][0];
      });

      expect(store.documents.map((d) => d.id)).toEqual(["a"]);
    });

    it("is hidden for viewers and when the trash is empty", () => {
      render(undefined, "viewer");
      expect(byText("Empty trash")).toBeUndefined();
      document.body.innerHTML = "";
      render([]);
      expect(byText("Empty trash")).toBeUndefined();
    });
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
    const restoreAlpha = byLabel("Restore Alpha");
    expect(restoreAlpha).not.toBeNull();
    expect(restoreAlpha?.getAttribute("aria-label")).toBe("Restore Alpha");
    const deleteAlpha = byLabel("Delete Alpha permanently");
    expect(deleteAlpha).not.toBeNull();
    expect(deleteAlpha?.getAttribute("aria-label")).toBe(
      "Delete Alpha permanently"
    );
  });

  describe("failed results", () => {
    const failure = (
      code: "FORBIDDEN" | "INVALID",
      message: string
    ): { ok: false; code: typeof code; message: string } => ({
      ok: false,
      code,
      message,
    });

    // Runs the toast.promise error handler with what the promise rejected with.
    async function rejection() {
      const [promise, options] = vi.mocked(toast.promise).mock.calls[0] as [
        Promise<unknown>,
        { error: (error: unknown) => string },
      ];
      const error = await promise.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(MutationFailureError);
      return options.error(error);
    }

    it("explains a denied restore and restores the trash state", async () => {
      restoreDocument.mockResolvedValueOnce(
        failure("FORBIDDEN", "No.") as never
      );
      const { store } = render();
      await act(async () => byLabel("Restore Alpha").click());

      let message = "";
      await act(async () => {
        message = await rejection();
      });
      expect(message).toBe("You do not have permission to restore pages.");
      expect(store.documents.find((d) => d.id === "a")?.inTrash).toBe(true);
    });

    it("shows the server message for a failed restore", async () => {
      restoreDocument.mockResolvedValueOnce(
        failure("INVALID", "Root page limit reached.") as never
      );
      render();
      await act(async () => byLabel("Restore Alpha").click());

      let message = "";
      await act(async () => {
        message = await rejection();
      });
      expect(message).toBe("Root page limit reached.");
    });

    it("explains a denied permanent delete and brings the page back", async () => {
      deleteDocumentPermanently.mockResolvedValueOnce(
        failure("FORBIDDEN", "No.") as never
      );
      const { store } = render();
      await act(async () => byLabel("Delete Alpha permanently").click());
      await act(async () => byText("Delete permanently")!.click());
      expect(store.documents.map((d) => d.id)).toEqual(["b"]);

      let message = "";
      await act(async () => {
        message = await rejection();
      });
      expect(message).toBe("You do not have permission to delete pages.");
      expect(store.documents.map((d) => d.id)).toEqual(["a", "b"]);
    });

    it("falls back to a generic message for unexpected errors", async () => {
      restoreDocument.mockRejectedValueOnce(new Error("stripped") as never);
      render();
      await act(async () => byLabel("Restore Alpha").click());

      const [promise, options] = vi.mocked(toast.promise).mock.calls[0] as [
        Promise<unknown>,
        { error: (error: unknown) => string },
      ];
      const error = await promise.catch((e: unknown) => e);
      expect(options.error(error)).toBe("Failed to restore page");
    });
  });
});
