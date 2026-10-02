import { describe, expect, it } from "vitest";

import type { PartialBlock } from "@blocknote/core";

import {
  getStoredDocumentContentState,
  parseStoredDocumentContent,
  serializeDocumentContent,
} from "./document-content";

describe("getStoredDocumentContentState", () => {
  it("marks empty content as empty", () => {
    expect(getStoredDocumentContentState(null)).toEqual({ status: "empty" });
    expect(getStoredDocumentContentState("")).toEqual({ status: "empty" });
  });

  it("marks invalid JSON as corrupt", () => {
    expect(getStoredDocumentContentState("{not json")).toEqual({
      status: "corrupt",
    });
  });

  it("marks non-array JSON as corrupt", () => {
    expect(
      getStoredDocumentContentState(JSON.stringify({ type: "paragraph" }))
    ).toEqual({
      status: "corrupt",
    });
  });

  it("marks block arrays with invalid entries as corrupt", () => {
    expect(
      getStoredDocumentContentState(JSON.stringify([{ content: "hi" }]))
    ).toEqual({
      status: "corrupt",
    });
  });
});

describe("parseStoredDocumentContent", () => {
  it("returns undefined for empty content", () => {
    expect(parseStoredDocumentContent(null)).toBeUndefined();
    expect(parseStoredDocumentContent("")).toBeUndefined();
    expect(parseStoredDocumentContent("   ")).toBeUndefined();
  });

  it("returns blocks for a valid JSON array", () => {
    const blocks: PartialBlock[] = [{ type: "paragraph", content: "Hello" }];
    expect(parseStoredDocumentContent(JSON.stringify(blocks))).toEqual(blocks);
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseStoredDocumentContent("{not json")).toBeUndefined();
  });

  it("returns undefined when JSON is not an array", () => {
    expect(
      parseStoredDocumentContent(JSON.stringify({ type: "paragraph" }))
    ).toBeUndefined();
  });
});

describe("serializeDocumentContent", () => {
  it("serializes blocks to JSON", () => {
    const blocks: PartialBlock[] = [{ type: "paragraph", content: "Hi" }];
    expect(serializeDocumentContent(blocks)).toBe(JSON.stringify(blocks));
  });
});
