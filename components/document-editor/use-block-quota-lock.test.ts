// @vitest-environment happy-dom

import { EventEmitter } from "node:events";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import type { HocuspocusProvider } from "@hocuspocus/provider";

import { useBlockQuotaLock } from "./use-block-quota-lock";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

class FakeProvider extends EventEmitter {
  on(event: string, listener: (...args: never[]) => void) {
    return super.on(event, listener as never);
  }
  off(event: string, listener: (...args: never[]) => void) {
    return super.off(event, listener as never);
  }
}

describe("useBlockQuotaLock", () => {
  it("locks on a block quota close and unlocks when the provider reconnects", () => {
    const provider = new FakeProvider();
    function Probe() {
      const locked = useBlockQuotaLock(
        provider as unknown as HocuspocusProvider
      );
      return React.createElement("span", null, String(locked));
    }
    const container = document.createElement("div");
    const root = createRoot(container);
    const locked = () => container.textContent === "true";
    act(() => root.render(React.createElement(Probe)));
    expect(locked()).toBe(false);

    act(() => {
      provider.emit("close", {
        event: { reason: "plan-quota-exceeded:block" },
      });
    });
    expect(locked()).toBe(true);

    act(() => {
      provider.emit("status", { status: "disconnected" });
    });
    expect(locked()).toBe(true);

    act(() => {
      provider.emit("status", { status: "connected" });
    });
    expect(locked()).toBe(false);

    act(() => {
      provider.emit("close", { event: { reason: "other" } });
    });
    expect(locked()).toBe(false);
    act(() => root.unmount());
  });
});
