import { describe, expect, it } from "vitest";

import { LIPI_TABLE_PREFIX, lipiTableName } from "./table-prefix";

describe("lipi table prefix", () => {
  it("uses a fixed lipi prefix constant", () => {
    expect(LIPI_TABLE_PREFIX).toBe("lipi");
    expect(lipiTableName("workspaces")).toBe("lipi_workspaces");
  });
});
