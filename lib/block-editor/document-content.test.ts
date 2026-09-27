import type { PartialBlock } from "@blocknote/core";
import { describe, expect, it } from "vitest";

import {
  parseStoredDocumentContent,
  serializeDocumentContent,
} from "./document-content";

describe("parseStoredDocumentContent", () => {
  it("returns undefined for empty content", () => {
    expect(parseStoredDocumentContent(null)).toBeUndefined();
    expect(parseStoredDocumentContent("")).toBeUndefined();
    expect(parseStoredDocumentContent("   ")).toBeUndefined();
  });

  it("returns blocks for a valid JSON array", () => {
    const blocks: PartialBlock[] = [
      { type: "paragraph", content: "Hello" },
    ];
    expect(parseStoredDocumentContent(JSON.stringify(blocks))).toEqual(blocks);
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseStoredDocumentContent("{not json")).toBeUndefined();
  });

  it("returns undefined when JSON is not an array", () => {
    expect(parseStoredDocumentContent(JSON.stringify({ type: "paragraph" }))).toBeUndefined();
  });
});

describe("serializeDocumentContent", () => {
  it("serializes blocks to JSON", () => {
    const blocks: PartialBlock[] = [{ type: "paragraph", content: "Hi" }];
    expect(serializeDocumentContent(blocks)).toBe(JSON.stringify(blocks));
  });
});
