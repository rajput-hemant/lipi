const block = (text: string) =>
  JSON.stringify([{ type: "paragraph", content: text }]);

export const LOCAL_WORKSPACE = {
  id: "d0000000-0000-4000-8000-000000000001",
  title: "Local Workspace",
  iconId: "📝",
} as const;

export const LOCAL_DOCUMENTS = [
  {
    id: "d0000000-0000-4000-8000-000000000011",
    parentId: null,
    title: "Welcome",
    icon: "👋",
    content: block("Seeded by bun run db:seed. Safe to edit."),
  },
  {
    id: "d0000000-0000-4000-8000-000000000012",
    parentId: "d0000000-0000-4000-8000-000000000011",
    title: "Nested page",
    icon: "📄",
    content: block("A child page to exercise the document tree."),
  },
  {
    id: "d0000000-0000-4000-8000-000000000013",
    parentId: null,
    title: "Scratchpad",
    icon: "✏️",
    content: block("Empty-ish page for experiments."),
  },
] as const;
