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

import { useDebouncedCallback } from "./use-debounced-callback";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.useRealTimers();
});

function mountHarness(onSave: (value: number) => void) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);

  function Harness() {
    const { debounced, flush } = useDebouncedCallback(onSave, 200);
    return (
      <>
        <button type="button" data-testid="save" onClick={() => debounced(1)}>
          save
        </button>
        <button type="button" data-testid="flush" onClick={() => flush()}>
          flush
        </button>
      </>
    );
  }

  act(() => {
    root.render(<Harness />);
  });

  return container;
}

describe("useDebouncedCallback", () => {
  it("flushes a pending callback on unmount", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();

    const container = mountHarness(onSave);
    container.querySelector<HTMLButtonElement>("[data-testid='save']")?.click();

    act(() => {
      roots[0]?.unmount();
    });

    expect(onSave).toHaveBeenCalledWith(1);
  });

  it("runs the callback immediately when flush is called", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();

    const container = mountHarness(onSave);
    container.querySelector<HTMLButtonElement>("[data-testid='save']")?.click();
    container.querySelector<HTMLButtonElement>("[data-testid='flush']")?.click();

    expect(onSave).toHaveBeenCalledWith(1);
    expect(onSave).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
