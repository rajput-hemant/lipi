// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("@/lib/auth/auth-client", () => ({ signIn: { email: vi.fn() } }));
vi.mock("./oauth-buttons", () => ({ OAuthButtons: () => null }));

beforeAll(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  mocks.toastError.mockReset();
  document.body.innerHTML = "";
});

async function render() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<LoginForm />));
  return root;
}

describe("LoginForm OAuthAccountNotLinked toast", () => {
  it("shows the toast once and not again on re-render", async () => {
    mocks.search = "error=OAuthAccountNotLinked";
    const root = await render();
    await act(async () => root.render(<LoginForm />));

    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledWith(
      "OAuth Account Not Linked",
      expect.objectContaining({ description: expect.any(String) })
    );
  });

  it("does not toast without the error param", async () => {
    mocks.search = "";
    await render();

    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});

describe("LoginForm forgot password link", () => {
  it("links to /forgot-password", async () => {
    mocks.search = "";
    await render();

    const link = Array.from(document.querySelectorAll("a")).find(
      (a) => a.textContent === "Forgot password?"
    );
    expect(link?.getAttribute("href")).toBe("/forgot-password");
  });
});
