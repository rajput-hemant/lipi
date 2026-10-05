// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { Document } from "@/types/db";

import { AppStateContext, createAppStore } from "@/hooks/use-app-state";
import { DocumentHeader } from "./document-header";

const { updateDocument } = vi.hoisted(() => ({ updateDocument: vi.fn() }));

vi.mock("@/lib/db/actions/document", () => ({ updateDocument }));
vi.mock("@/components/realtime/workspace-realtime-provider", () => ({
  useNotifyWorkspacePageChanges: () => vi.fn(),
}));
vi.mock("@/components/emoji-picker", () => ({
  EmojiPicker: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/uploadthing", () => ({ uploadImage: vi.fn() }));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

const page = {
  id: "p1",
  workspaceId: "ws-1",
  title: "Original",
  icon: "",
  bannerUrl: null,
} as unknown as Document;

async function editTitle(title: string) {
  const store = createAppStore({
    user: null,
    workspace: null,
    documents: [],
    role: "editor",
  } as unknown as Parameters<typeof createAppStore>[0]);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppStateContext.Provider value={store}>
        <DocumentHeader document={page} />
      </AppStateContext.Provider>
    );
  });
  const textarea = container.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    )!.set!.call(textarea, title);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
}

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("DocumentHeader save failures", () => {
  it("shows a permission message when the save is denied", async () => {
    vi.useFakeTimers();
    updateDocument.mockResolvedValue({ ok: false, code: "FORBIDDEN" });

    await editTitle("Renamed");

    expect(updateDocument).toHaveBeenCalledWith({
      id: "p1",
      title: "Renamed",
    });
    expect(toast.error).toHaveBeenCalledWith(
      "You do not have permission to edit this page."
    );
  });

  it("keeps the generic message for other failures", async () => {
    vi.useFakeTimers();
    updateDocument.mockRejectedValue(new Error("boom"));

    await editTitle("Renamed");

    expect(toast.error).toHaveBeenCalledWith(
      "Could not save document details."
    );
  });
});
