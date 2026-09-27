import { describe, expect, it } from "vitest";

import {
  createSearchSnippet,
  extractPlainTextFromDocumentContent,
} from "./search-utils";

describe("extractPlainTextFromDocumentContent", () => {
  it("returns empty string for null, undefined, or empty string", () => {
    expect(extractPlainTextFromDocumentContent(null)).toBe("");
    expect(extractPlainTextFromDocumentContent(undefined)).toBe("");
    expect(extractPlainTextFromDocumentContent("")).toBe("");
    expect(extractPlainTextFromDocumentContent("   ")).toBe("");
  });

  it("returns plain text string if not valid JSON", () => {
    expect(extractPlainTextFromDocumentContent("Just plain text")).toBe(
      "Just plain text"
    );
  });

  it("extracts text from standard BlockNote JSON blocks", () => {
    const blocks = [
      {
        id: "1",
        type: "paragraph",
        content: [
          { type: "text", text: "Hello", styles: {} },
          { type: "text", text: "World", styles: { bold: true } },
        ],
      },
    ];

    expect(extractPlainTextFromDocumentContent(JSON.stringify(blocks))).toBe(
      "Hello World"
    );
  });

  it("extracts text recursively from children and nested link items", () => {
    const blocks = [
      {
        id: "1",
        type: "heading",
        content: [{ type: "text", text: "Title" }],
        children: [
          {
            id: "2",
            type: "paragraph",
            content: [
              {
                type: "link",
                href: "https://example.com",
                content: [{ type: "text", text: "Click here" }],
              },
            ],
          },
        ],
      },
    ];

    expect(extractPlainTextFromDocumentContent(JSON.stringify(blocks))).toBe(
      "Title Click here"
    );
  });

  it("extracts text from code block props", () => {
    const blocks = [
      {
        id: "1",
        type: "codeBlock",
        props: { code: "const x = 42;" },
      },
    ];

    expect(extractPlainTextFromDocumentContent(JSON.stringify(blocks))).toBe(
      "const x = 42;"
    );
  });
});

describe("createSearchSnippet", () => {
  it("returns undefined for empty query or empty text", () => {
    expect(createSearchSnippet("", "query")).toBeUndefined();
    expect(createSearchSnippet("Some text", "")).toBeUndefined();
    expect(createSearchSnippet("Some text", "   ")).toBeUndefined();
  });

  it("returns undefined if query does not match", () => {
    expect(
      createSearchSnippet("The quick brown fox", "elephant")
    ).toBeUndefined();
  });

  it("extracts match case-insensitively with context", () => {
    const text =
      "This is a comprehensive document outlining the release roadmap and launch goals for Q4.";
    const snippet = createSearchSnippet(text, "roadmap", 30);

    expect(snippet).toBeDefined();
    expect(snippet).toContain("roadmap");
    expect(snippet).toContain("outlining the release");
  });

  it("adds ellipses when text is trimmed before and after match", () => {
    const text =
      "Start text with a lot of padding words and sentences to ensure that the keyword appears in the very middle of a long article.";
    const snippet = createSearchSnippet(text, "keyword", 15);

    expect(snippet?.startsWith("... ")).toBe(true);
    expect(snippet?.endsWith(" ...")).toBe(true);
  });
});
