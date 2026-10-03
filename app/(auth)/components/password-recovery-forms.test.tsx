// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

const mocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  push: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/lib/auth/auth-client", () => ({
  requestPasswordReset: mocks.requestPasswordReset,
  resetPassword: mocks.resetPassword,
}));

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
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

async function fillAndSubmit(ui: React.ReactElement, values: string[]) {
  const container = document.createElement("div");
  document.body.append(container);
  await act(async () => createRoot(container).render(ui));

  const inputs = Array.from(container.querySelectorAll("input"));
  await act(async () => {
    values.forEach((value, i) => setValue(inputs[i], value));
  });
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  return container;
}

describe("ForgotPasswordForm", () => {
  it("shows the same neutral message whatever the API says about the account", async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      data: { status: true },
      error: null,
    });

    const container = await fillAndSubmit(<ForgotPasswordForm />, [
      "nobody@example.com",
    ]);

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      email: "nobody@example.com",
      redirectTo: "/reset-password",
    });
    expect(container.querySelector("[role=status]")?.textContent).toContain(
      "If an account exists for that email, we sent a link"
    );
    expect(container.querySelector("form")).toBeNull();
  });

  it("toasts and keeps the form when the request fails", async () => {
    mocks.requestPasswordReset.mockResolvedValue({
      data: null,
      error: { message: "Too many requests" },
    });

    const container = await fillAndSubmit(<ForgotPasswordForm />, [
      "ada@example.com",
    ]);

    expect(mocks.toast.error).toHaveBeenCalled();
    expect(container.querySelector("[role=status]")).toBeNull();
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("does not call the API for an invalid email", async () => {
    await fillAndSubmit(<ForgotPasswordForm />, ["not-an-email"]);

    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordForm", () => {
  it("resets with the token and sends the user to login", async () => {
    mocks.resetPassword.mockResolvedValue({ data: {}, error: null });

    await fillAndSubmit(<ResetPasswordForm token="tok" />, [
      "Another-pass2!",
      "Another-pass2!",
    ]);

    expect(mocks.resetPassword).toHaveBeenCalledWith({
      newPassword: "Another-pass2!",
      token: "tok",
    });
    expect(mocks.push).toHaveBeenCalledWith("/login");
  });

  it("shows the API error and stays on the page", async () => {
    mocks.resetPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid token" },
    });

    await fillAndSubmit(<ResetPasswordForm token="old" />, [
      "Another-pass2!",
      "Another-pass2!",
    ]);

    expect(mocks.toast.error).toHaveBeenCalledWith("Invalid token");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("does not call the API when the passwords differ or are weak", async () => {
    await fillAndSubmit(<ResetPasswordForm token="tok" />, [
      "Another-pass2!",
      "Different-pass3!",
    ]);
    await fillAndSubmit(<ResetPasswordForm token="tok" />, ["weak", "weak"]);

    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
});
