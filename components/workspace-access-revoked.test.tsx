// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { WorkspaceAccessRevoked } from "./workspace-access-revoked";

describe("WorkspaceAccessRevoked", () => {
  it("explains the lost access and links back to the dashboard", () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    act(() => createRoot(container).render(<WorkspaceAccessRevoked />));

    expect(container.textContent).toContain(
      "You no longer have access to this workspace"
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/dashboard"
    );
  });
});
