import { describe, expect, it } from "vitest";

import { classifyDefaultHistory } from "./migration-history";

const lipi = new Set(["a", "b"]);

describe("classifyDefaultHistory", () => {
  it("ignores history with no Lipi rows", () => {
    expect(
      classifyDefaultHistory([{ hash: "x", created_at: 1 }], lipi)
    ).toEqual({ action: "none" });
    expect(classifyDefaultHistory([], lipi)).toEqual({ action: "none" });
  });

  it("copies history made only of Lipi rows", () => {
    const rows = [
      { hash: "a", created_at: 1 },
      { hash: "b", created_at: 2 },
    ];
    expect(classifyDefaultHistory(rows, lipi)).toEqual({
      action: "copy",
      rows,
    });
  });

  it("reports mixed Lipi and foreign history as ambiguous", () => {
    expect(
      classifyDefaultHistory(
        [
          { hash: "a", created_at: 1 },
          { hash: "x", created_at: 2 },
        ],
        lipi
      )
    ).toEqual({ action: "ambiguous", lipi: 1, foreign: 1 });
  });
});
