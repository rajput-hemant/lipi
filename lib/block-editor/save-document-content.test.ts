import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/document", () => ({
  updateDocument: vi.fn(),
}));

import { updateDocument } from "@/lib/db/queries/document";

import { saveDocumentContent } from "./save-document-content";

const documentId = "550e8400-e29b-41d4-a716-446655440000";

describe("saveDocumentContent", () => {
  it("persists serialized blocks through updateDocument", async () => {
    vi.mocked(updateDocument).mockResolvedValue({ id: documentId } as never);

    await saveDocumentContent({
      documentId,
      blocks: [
        {
          id: "block-1",
          type: "paragraph",
          props: {
            backgroundColor: "default",
            textColor: "default",
            textAlignment: "left",
          },
          content: [],
          children: [],
        },
      ] as never,
    });

    expect(updateDocument).toHaveBeenCalledWith({
      id: documentId,
      content: JSON.stringify([
        {
          id: "block-1",
          type: "paragraph",
          props: {
            backgroundColor: "default",
            textColor: "default",
            textAlignment: "left",
          },
          content: [],
          children: [],
        },
      ]),
    });
  });

  it("rejects serialized content above the configured limit", async () => {
    const oversizedPayload = "x".repeat(512_001);

    await expect(
      saveDocumentContent({
        documentId,
        blocks: [{ type: "paragraph", content: oversizedPayload }] as never,
      }),
    ).rejects.toThrow("Document content is too large");

    expect(updateDocument).not.toHaveBeenCalled();
  });
});
