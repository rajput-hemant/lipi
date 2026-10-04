import { afterEach, describe, expect, it, vi } from "vitest";

import { createAppStore, syncAppStore } from "@/hooks/use-app-state";
import { cn, getGitHubStars } from "@/lib/utils";

const ts = "2026-01-01T00:00:00.000Z";

describe("smoke", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("syncAppStore replaces workspace data", () => {
    const store = createAppStore({
      user: null,
      documents: [
        {
          id: "old-doc",
          title: "Old",
          icon: "",
          bannerUrl: null,
          workspaceId: "ws-a",
          parentId: null,
          inTrash: false,
          createdAt: ts,
          updatedAt: ts,
        },
      ],
    });

    syncAppStore(store, { user: null, documents: [] });

    expect(store.documents).toHaveLength(0);
  });

  it("creates isolated valtio stores", () => {
    const a = createAppStore({ user: null, documents: [] });
    const b = createAppStore({ user: null, documents: [] });

    a.addDocument({
      id: "doc-a",
      title: "A",
      icon: "",
      bannerUrl: null,
      workspaceId: "ws",
      parentId: null,
      inTrash: false,
      createdAt: ts,
      updatedAt: ts,
    });

    expect(a.documents).toHaveLength(1);
    expect(b.documents).toHaveLength(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITHUB_ACCESS_TOKEN;
  });

  it("omits github authorization without a token", async () => {
    delete process.env.GITHUB_ACCESS_TOKEN;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 42 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getGitHubStars();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBeUndefined();
  });
});
