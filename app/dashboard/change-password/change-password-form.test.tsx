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

import { ChangePasswordForm } from "./change-password-form";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth/auth-client", () => ({
  changePassword: mocks.changePassword,
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));

const globals = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
let previousActEnvironment: boolean | undefined;

beforeAll(() => {
  previousActEnvironment = globals.IS_REACT_ACT_ENVIRONMENT;
  globals.IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  globals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function submit(current: string, next: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<ChangePasswordForm />));

  const [currentInput, newInput] = Array.from(
    container.querySelectorAll("input")
  );
  await act(async () => {
    setValue(currentInput, current);
    setValue(newInput, next);
  });
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  return { container, currentInput, newInput };
}

describe("ChangePasswordForm", () => {
  it("changes the password and revokes other sessions", async () => {
    mocks.changePassword.mockResolvedValue({ data: {}, error: null });

    const { currentInput } = await submit("Current-pass1!", "Another-pass2!");

    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "Current-pass1!",
      newPassword: "Another-pass2!",
      revokeOtherSessions: true,
    });
    expect(mocks.toast.success).toHaveBeenCalled();
    expect(currentInput.value).toBe("");
  });

  it("shows the API error and keeps the input", async () => {
    mocks.changePassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid password" },
    });

    const { currentInput } = await submit("Wrong-pass1!", "Another-pass2!");

    expect(mocks.toast.error).toHaveBeenCalledWith("Invalid password");
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(currentInput.value).toBe("Wrong-pass1!");
  });

  it("does not call the API when the new password breaks the rules", async () => {
    await submit("Current-pass1!", "weak");

    expect(mocks.changePassword).not.toHaveBeenCalled();
  });
});
