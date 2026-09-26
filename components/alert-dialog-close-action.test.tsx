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

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialogCloseAction } from "./alert-dialog-close-action";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("AlertDialogCloseAction", () => {
  it("closes the dialog when the confirm action is activated", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    function Harness() {
      const [open, setOpen] = React.useState(true);
      return (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogCloseAction
              onClick={() => undefined}
              variant="destructive"
            >
              Delete
            </AlertDialogCloseAction>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    act(() => root.render(<Harness />));

    const action = document.querySelector('[data-slot="alert-dialog-action"]');
    expect(action).toBeTruthy();

    await act(async () => {
      action?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    expect(
      document.querySelector('[data-slot="alert-dialog-content"]')
    ).toBeNull();
  });
});
