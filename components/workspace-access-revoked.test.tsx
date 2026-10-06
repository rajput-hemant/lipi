// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceAccessRevoked } from "./workspace-access-revoked";

describe("WorkspaceAccessRevoked", () => {
  it("explains lost access and offers a dashboard link without button warnings", () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      act(() => root.render(<WorkspaceAccessRevoked />));
      expect(container.textContent).toContain(
        "You no longer have access to this workspace"
      );
      expect(container.querySelector("a")?.getAttribute("href")).toBe(
        "/dashboard"
      );
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      act(() => root.unmount());
      container.remove();
      consoleError.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
