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
  env: { STRIPE_PRICE_ID_PRO: "price_pro_test" },
  currentUser: null as { id: string } | null,
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => mocks.currentUser,
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

describe.skipIf(!testDatabaseUrl)("document actions against Postgres", () => {
  const sql = createTestClient(testDatabaseUrl!);
  const fixtures = createTestFixtures(sql);
  let actions: typeof import("./document");
  let owner: string;
  let workspace: string;

  const inTrash = async (id: string) => {
    const [row] =
      await sql`select in_trash from lipi_documents where id = ${id}`;
    return row?.in_trash as boolean | undefined;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl!;
    actions = await import("./document");
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

  it("creates a document and omits content from the returned summary", async () => {
    const id = crypto.randomUUID();
    const result = await actions.createDocument({
      id,
      workspaceId: workspace,
      title: "First",
    });

    expect(result).toMatchObject({ ok: true, data: { id, title: "First" } });
    expect(result.ok && "content" in result.data).toBe(false);
  });

  it("enforces the free root page limit but allows children and Pro owners", async () => {
    for (const title of ["a", "b", "c"]) {
      await fixtures.document(workspace, { title });
    }

    await expect(
      actions.createDocument({
        id: crypto.randomUUID(),
        workspaceId: workspace,
        title: "d",
      })
    ).rejects.toThrow("Root page limit reached");

    const [parent] =
      await sql`select id from lipi_documents where workspace_id = ${workspace} limit 1`;
    const child = await actions.createDocument({
      id: crypto.randomUUID(),
      workspaceId: workspace,
      parentId: parent.id,
      title: "child",
    });
    expect(child).toMatchObject({ ok: true });

    await fixtures.subscription(owner, "price_pro_test");
    const pro = await actions.createDocument({
      id: crypto.randomUUID(),
      workspaceId: workspace,
      title: "d",
    });
    expect(pro).toMatchObject({ ok: true });
  });

  it("rejects a signed-in user who is not a member", async () => {
    mocks.currentUser = { id: await fixtures.user("stranger") };
    const existing = await fixtures.document(workspace);

    expect(
      await actions.createDocument({
        id: crypto.randomUUID(),
        workspaceId: workspace,
        title: "nope",
      })
    ).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(await actions.softDeleteDocumentTree(existing)).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    });
    await expect(actions.getDocuments(workspace)).rejects.toThrow();
    expect(await inTrash(existing)).toBe(false);
  });

  it("lets a viewer read but not write", async () => {
    const viewer = await fixtures.user("viewer");
    await fixtures.collaborator(workspace, viewer, "viewer");
    const existing = await fixtures.document(workspace, { title: "Shared" });
    mocks.currentUser = { id: viewer };

    await expect(actions.getDocuments(workspace)).resolves.toHaveLength(1);
    expect(await actions.softDeleteDocumentTree(existing)).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    });
  });

  it("lists documents oldest first without content", async () => {
    const earlier = new Date(Date.now() - 60_000);
    const later = new Date();
    const second = await fixtures.document(workspace, {
      title: "second",
      content: "body",
      createdAt: later,
    });
    const first = await fixtures.document(workspace, {
      title: "first",
      createdAt: earlier,
    });

    const rows = await actions.getDocuments(workspace);

    expect(rows.map((row) => row.id)).toEqual([first, second]);
    expect(rows.every((row) => !("content" in row))).toBe(true);
  });

  it("trashes a subtree, restores it, and only then deletes it permanently", async () => {
    const root = await fixtures.document(workspace, { title: "root" });
    const child = await fixtures.document(workspace, {
      title: "child",
      parentId: root,
    });
    const grandchild = await fixtures.document(workspace, {
      title: "grandchild",
      parentId: child,
    });
    const sibling = await fixtures.document(workspace, { title: "sibling" });

    expect(await actions.deleteDocumentPermanently(root)).toMatchObject({
      ok: false,
    });

    expect(await actions.softDeleteDocumentTree(root)).toEqual({
      ok: true,
      data: 3,
    });
    expect(await inTrash(grandchild)).toBe(true);
    expect(await inTrash(sibling)).toBe(false);

    expect(await actions.restoreDocument(grandchild)).toEqual({
      ok: true,
      data: 3,
    });
    expect(await inTrash(root)).toBe(false);

    await actions.softDeleteDocumentTree(root);
    expect(await actions.deleteDocumentPermanently(root)).toEqual({
      ok: true,
      data: 3,
    });
    const remaining =
      await sql`select id from lipi_documents where workspace_id = ${workspace}`;
    expect(remaining.map((row) => row.id)).toEqual([sibling]);
  });

  it("refuses to restore a root page past the free limit", async () => {
    const trashed = await fixtures.document(workspace, {
      title: "trashed",
      inTrash: true,
    });
    for (const title of ["a", "b", "c"]) {
      await fixtures.document(workspace, { title });
    }

    expect(await actions.restoreDocument(trashed)).toMatchObject({
      ok: false,
    });
    expect(await inTrash(trashed)).toBe(true);
  });

  it("updates a title, validates the new parent, and applies the root quota", async () => {
    const parent = await fixtures.document(workspace, { title: "parent" });
    const child = await fixtures.document(workspace, {
      title: "child",
      parentId: parent,
    });

    const renamed = await actions.updateDocument({
      id: child,
      title: "renamed",
    });
    expect(renamed).toMatchObject({ ok: true, data: { title: "renamed" } });

    expect(
      await actions.updateDocument({ id: parent, parentId: child })
    ).toMatchObject({ ok: false });

    for (const title of ["x", "y"]) {
      await fixtures.document(workspace, { title });
    }
    expect(
      await actions.updateDocument({ id: child, parentId: null })
    ).toMatchObject({ ok: false });
    const [row] =
      await sql`select parent_id from lipi_documents where id = ${child}`;
    expect(row.parent_id).toBe(parent);
  });

  it("duplicates a subtree with copied content and a new root title", async () => {
    const root = await fixtures.document(workspace, {
      title: "root",
      content: "root body",
    });
    const child = await fixtures.document(workspace, {
      title: "child",
      parentId: root,
      content: "child body",
    });
    const copyId = crypto.randomUUID();

    const result = await actions.duplicateDocument({
      sourceId: root,
      newId: copyId,
    });

    expect(result).toMatchObject({
      ok: true,
      data: { id: copyId, title: "root copy" },
    });
    const copies = await sql`
      select title, content, parent_id from lipi_documents
      where workspace_id = ${workspace} and id not in (${root}, ${child})
      order by title`;
    expect(copies.map((row) => [row.title, row.content])).toEqual([
      ["child", "child body"],
      ["root copy", "root body"],
    ]);
    expect(copies.find((row) => row.title === "child")?.parent_id).toBe(copyId);
  });
});
