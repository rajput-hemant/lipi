import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "./send-email";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  env: {} as Record<string, string | undefined>,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
vi.mock("@/lib/env", () => ({ env: mocks.env }));

const email = {
  to: "ada@example.com",
  subject: "Hello",
  html: "<p>Link https://app.test/reset?token=secret</p>",
  text: "Link https://app.test/reset?token=secret",
};

let info: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mocks.send.mockReset();
  for (const key of Object.keys(mocks.env)) delete mocks.env[key];
  mocks.env.NODE_ENV = "development";
  info = vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => info.mockRestore());

describe("sendEmail", () => {
  it("sends through Resend with the configured sender", async () => {
    mocks.env.RESEND_API_KEY = "re_test";
    mocks.env.EMAIL_FROM = "Lipi <noreply@lipi.test>";
    mocks.send.mockResolvedValue({ data: { id: "1" }, error: null });

    await sendEmail(email);

    expect(mocks.send).toHaveBeenCalledWith({
      from: "Lipi <noreply@lipi.test>",
      ...email,
    });
    expect(info).not.toHaveBeenCalled();
  });

  it("throws when Resend reports an error", async () => {
    mocks.env.RESEND_API_KEY = "re_test";
    mocks.env.EMAIL_FROM = "noreply@lipi.test";
    mocks.send.mockResolvedValue({ data: null, error: { message: "bad" } });

    await expect(sendEmail(email)).rejects.toThrow("bad");
  });

  it("throws when the key is set but the sender is not", async () => {
    mocks.env.RESEND_API_KEY = "re_test";

    await expect(sendEmail(email)).rejects.toThrow("EMAIL_FROM");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("logs the message in development without a key", async () => {
    await sendEmail(email);

    expect(mocks.send).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining("token=secret"));
  });

  it("never logs in production without a key", async () => {
    mocks.env.NODE_ENV = "production";

    await expect(sendEmail(email)).rejects.toThrow("RESEND_API_KEY");
    expect(info).not.toHaveBeenCalled();
  });
});
