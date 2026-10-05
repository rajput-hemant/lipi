import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cacheMap = new Map<Function, Map<string, unknown>>();
  return {
    reactCache: vi.fn((fn: Function) => {
      let fnCache = cacheMap.get(fn);
      if (!fnCache) {
        fnCache = new Map();
        cacheMap.set(fn, fnCache);
      }
      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        if (fnCache!.has(key)) {
          return fnCache!.get(key);
        }
        const result = fn(...args);
        fnCache!.set(key, result);
        return result;
      };
    }),
    clearCache: () => cacheMap.clear(),
    findWorkspace: vi.fn(),
    findCollaborator: vi.fn(),
    unstableCache: vi.fn((fn: Function) => fn),
    getCurrentUser: vi.fn(),
  };
});

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: mocks.reactCache,
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("next/cache", () => ({
  unstable_cache: mocks.unstableCache,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      workspaces: { findFirst: mocks.findWorkspace },
      collaborators: { findFirst: mocks.findCollaborator },
    },
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve([{ id: "doc-1", title: "Doc 1" }]),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/billing/quota-entitlement", () => ({
  workspaceOwnerHasProPlanEntitlement: vi.fn(),
}));
vi.mock("@/lib/realtime/authoritative-content", () => ({
  loadAuthoritativeDocumentContentBySourceIds: vi.fn(),
}));

describe("request-scoped React cache deduplication (F-PERF-5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearCache();
  });

  it("deduplicates getWorkspaceMembershipRole calls within the same request", async () => {
    const { getWorkspaceMembershipRole } = await import("./data/mutation-auth");

    mocks.findWorkspace.mockResolvedValue({
      id: "ws-1",
      workspaceOwnerId: "owner-1",
    });

    const role1 = await getWorkspaceMembershipRole("owner-1", "ws-1");
    const role2 = await getWorkspaceMembershipRole("owner-1", "ws-1");

    expect(role1).toEqual({
      workspace: { id: "ws-1", workspaceOwnerId: "owner-1" },
      role: "owner",
    });
    expect(role2).toBe(role1);
    expect(mocks.findWorkspace).toHaveBeenCalledTimes(1);
  });

  it("deduplicates getDocuments calls within the same request", async () => {
    const { getDocuments } = await import("./actions/document");
    const workspaceId = crypto.randomUUID();

    mocks.getCurrentUser.mockResolvedValue({ id: "owner-1" });
    mocks.findWorkspace.mockResolvedValue({
      id: workspaceId,
      workspaceOwnerId: "owner-1",
    });

    const doc1 = await getDocuments(workspaceId);
    const doc2 = await getDocuments(workspaceId);

    expect(doc1).toEqual([{ id: "doc-1", title: "Doc 1" }]);
    expect(doc2).toBe(doc1);
    // User check and workspace access query only ran once
    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(mocks.findWorkspace).toHaveBeenCalledTimes(1);
  });
});
