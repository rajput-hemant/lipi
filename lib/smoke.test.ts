import { afterEach, describe, expect, it, vi } from "vitest";

import { createAppStore } from "@/hooks/use-app-state";
import { getGitHubStars } from "@/lib/utils";
import { cn } from "@/lib/utils";

describe("smoke", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("creates isolated valtio stores", () => {
    const a = createAppStore({ user: null, files: [], folders: [] });
    const b = createAppStore({ user: null, files: [], folders: [] });

    a.addFile({
      id: "file-a",
      title: "A",
      iconId: "icon",
      data: null,
      bannerUrl: null,
      workspaceId: "ws",
      folderId: "folder",
      inTrash: false,
      createdAt: new Date().toISOString(),
    });

    expect(a.files).toHaveLength(1);
    expect(b.files).toHaveLength(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GITHUB_ACCESS_TOKEN;
  });

  it("omits github authorization without a token", async () => {
    delete process.env.GITHUB_ACCESS_TOKEN;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: "42" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getGitHubStars();

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBeUndefined();
  });
});
