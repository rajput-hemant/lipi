import { describe, expect, it } from "vitest";

import { updateDocumentSchema } from "./document";

describe("updateDocumentSchema", () => {
  it("strips inTrash so raw updates cannot trash or restore a single row", () => {
    const parsed = updateDocumentSchema.parse({
      id: crypto.randomUUID(),
      title: "Renamed",
      inTrash: true,
    });

    expect(parsed).not.toHaveProperty("inTrash");
    expect(parsed.title).toBe("Renamed");
  });
});
