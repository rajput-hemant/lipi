import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createTestClient,
  createTestFixtures,
  resolveTestDatabaseUrl,
} from "@/lib/db/test-database";

const testDatabaseUrl = await resolveTestDatabaseUrl();

const mocks = vi.hoisted(() => ({
  currentUser: null as { id: string } | null,
}));

vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => mocks.currentUser,
}));

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

describe.skipIf(!testDatabaseUrl)("workspace search against Postgres", () => {
  const sql = createTestClient(testDatabaseUrl!);
  const fixtures = createTestFixtures(sql);
  let search: typeof import("./search");
  let owner: string;
  let workspace: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl!;
    search = await import("./search");
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await sql.end({ timeout: 1 });
    const { db } = await import("@/lib/db");
    await (db.$client as { end: () => Promise<void> }).end();
  });

  beforeEach(async () => {
    owner = await fixtures.user("owner");
    workspace = await fixtures.workspace(owner);
    mocks.currentUser = { id: owner };
  });

  it("lists the ten most recently updated active pages without snippets for an empty query", async () => {
    for (let index = 0; index < 12; index++) {
      await fixtures.document(workspace, {
        title: `Page ${index}`,
        content: "secret body",
        updatedAt: minutesAgo(index + 1),
      });
    }
    await fixtures.document(workspace, {
      title: "Trashed",
      inTrash: true,
      updatedAt: minutesAgo(0),
    });
    const otherWorkspace = await fixtures.workspace(await fixtures.user("o"));
    await fixtures.document(otherWorkspace, { title: "Elsewhere" });

    const results = await search.searchDocumentsInWorkspace(workspace, "   ");

    expect(results.map((row) => row.title)).toEqual(
      Array.from({ length: 10 }, (_, index) => `Page ${index}`)
    );
    for (const row of results) {
      expect(Object.keys(row).sort()).toEqual(
        ["icon", "id", "title", "updatedAt", "workspaceId"].sort()
      );
      expect(row.workspaceId).toBe(workspace);
    }
  });

  it("matches title or content, caps at twenty, and adds a snippet", async () => {
    for (let index = 0; index < 22; index++) {
      await fixtures.document(workspace, {
        title: index % 2 ? `Needle ${index}` : `Plain ${index}`,
        content:
          index % 2 ? null : (
            JSON.stringify([
              {
                type: "paragraph",
                content: [{ type: "text", text: "a needle inside" }],
              },
            ])
          ),
        updatedAt: minutesAgo(index + 1),
      });
    }
    await fixtures.document(workspace, {
      title: "Needle trashed",
      inTrash: true,
    });

    const results = await search.searchDocumentsInWorkspace(
      workspace,
      "needle"
    );

    expect(results).toHaveLength(20);
    expect(results.map((row) => row.title)[0]).toBe("Plain 0");
    expect(results.some((row) => row.title === "Needle trashed")).toBe(false);
    for (const row of results) {
      expect(Object.keys(row).sort()).toEqual(
        ["icon", "id", "snippet", "title", "updatedAt", "workspaceId"].sort()
      );
    }
    const fromContent = results.find((row) => row.title === "Plain 0");
    expect(fromContent?.snippet).toContain("needle");
  });

  it("treats percent and underscore literally", async () => {
    await fixtures.document(workspace, { title: "100% done" });
    await fixtures.document(workspace, { title: "snake_case" });
    await fixtures.document(workspace, { title: "snakeXcase" });

    const percent = await search.searchDocumentsInWorkspace(workspace, "%");
    const underscore = await search.searchDocumentsInWorkspace(
      workspace,
      "e_c"
    );

    expect(percent.map((row) => row.title)).toEqual(["100% done"]);
    expect(underscore.map((row) => row.title)).toEqual(["snake_case"]);
  });

  it("rejects a non-member", async () => {
    mocks.currentUser = { id: await fixtures.user("stranger") };

    await expect(
      search.searchDocumentsInWorkspace(workspace, "")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
