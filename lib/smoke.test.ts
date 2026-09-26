import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("smoke", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
