import { describe, expect, it } from "vitest";

import { createAppStore } from "./use-app-state";

const alice = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Alice",
  image: null,
  color: "#7c3aed",
};

describe("createAppStore setCollaborators", () => {
  it("keeps the same roster reference when nothing changed", () => {
    const store = createAppStore({ user: null, documents: [] });
    store.setCollaborators([alice]);
    const first = store.collaborators;

    store.setCollaborators([{ ...alice }]);

    expect(store.collaborators).toBe(first);
  });

  it("replaces the roster when a collaborator changes", () => {
    const store = createAppStore({ user: null, documents: [] });
    store.setCollaborators([alice]);

    store.setCollaborators([{ ...alice, name: "Alicia" }]);

    expect(store.collaborators[0].name).toBe("Alicia");
  });
});
