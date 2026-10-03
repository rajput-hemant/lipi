import { describe, expect, it } from "vitest";

import {
  formatUpdatedDate,
  sortByRecentlyUpdated,
  withParentTitles,
} from "./workspace-pages";

const page = (id: string, updatedAt: string, extra = {}) => ({
  id,
  title: id,
  parentId: null as string | null,
  updatedAt,
  ...extra,
});

describe("sortByRecentlyUpdated", () => {
  it("orders newest first without mutating the input", () => {
    const input = [
      page("a", "2026-01-01T00:00:00Z"),
      page("b", "2026-03-01T00:00:00Z"),
      page("c", "2026-02-01T00:00:00Z"),
    ];

    expect(sortByRecentlyUpdated(input).map((p) => p.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(input.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks ties by id", () => {
    const same = "2026-01-01T00:00:00Z";
    const sorted = sortByRecentlyUpdated([page("b", same), page("a", same)]);

    expect(sorted.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("withParentTitles", () => {
  it("names the parent of subpages and leaves root pages alone", () => {
    const result = withParentTitles([
      page("root", "2026-01-01T00:00:00Z", { title: "Root" }),
      page("child", "2026-01-01T00:00:00Z", { parentId: "root" }),
    ]);

    expect(result.map((p) => p.parentTitle)).toEqual([null, "Root"]);
  });

  it("falls back to Untitled and ignores parents outside the list", () => {
    const result = withParentTitles([
      page("p", "2026-01-01T00:00:00Z", { title: "" }),
      page("c1", "2026-01-01T00:00:00Z", { parentId: "p" }),
      page("c2", "2026-01-01T00:00:00Z", { parentId: "gone" }),
    ]);

    expect(result.map((p) => p.parentTitle)).toEqual([null, "Untitled", null]);
  });
});

describe("formatUpdatedDate", () => {
  it("is deterministic by default (en-US, UTC)", () => {
    expect(formatUpdatedDate("2026-03-04T23:30:00Z")).toBe("Mar 4");
  });

  it("honours the viewer's locale and time zone", () => {
    expect(
      formatUpdatedDate("2026-03-04T23:30:00Z", "en-US", "Asia/Tokyo")
    ).toBe("Mar 5");
    expect(formatUpdatedDate("2026-03-04T12:00:00Z", "de-DE", "UTC")).toBe(
      "4. März"
    );
  });

  it("falls back for invalid dates", () => {
    expect(formatUpdatedDate("not a date")).toBe("Recently");
  });
});
