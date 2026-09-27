// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { WorkspaceRealtimeProvider } from "./workspace-realtime-provider";

const refresh = vi.fn();
const providerHandlers = new Map<string, Set<(payload: unknown) => void>>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/realtime/client", () => ({
  fetchRealtimeToken: vi.fn().mockResolvedValue("token"),
  getRealtimeUrl: () => "ws://127.0.0.1:1235",
}));

vi.mock("@/lib/realtime/shared-websocket", () => ({
  getSharedHocuspocusWebsocket: () => ({}),
}));

vi.mock("@hocuspocus/provider", () => ({
  HocuspocusProvider: class {
    isAuthenticated = false;

    attach() {}

    destroy() {}

    sendStateless() {}

    sendToken() {}

    on(event: string, handler: (payload: unknown) => void) {
      const handlers = providerHandlers.get(event) ?? new Set();
      handlers.add(handler);
      providerHandlers.set(event, handlers);
    }

    off(event: string, handler: (payload: unknown) => void) {
      providerHandlers.get(event)?.delete(handler);
    }
  },
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

function emitProviderEvent(event: string, payload: unknown) {
  for (const handler of providerHandlers.get(event) ?? []) {
    handler(payload);
  }
}

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  providerHandlers.clear();
  refresh.mockClear();
});

describe("WorkspaceRealtimeProvider", () => {
  it("refreshes the sidebar when the websocket reconnects", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <WorkspaceRealtimeProvider workspaceId="workspace-1">
          <div>child</div>
        </WorkspaceRealtimeProvider>
      );
    });

    emitProviderEvent("status", { status: "connected" });

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
