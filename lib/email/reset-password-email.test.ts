import { describe, expect, it } from "vitest";

import { buildResetPasswordEmail } from "./reset-password-email";

describe("buildResetPasswordEmail", () => {
  it("puts the link and expiry in both the text and html parts", () => {
    const url = "https://app.test/api/auth/reset-password/tok?callbackURL=%2Fx";
    const { subject, text, html } = buildResetPasswordEmail(url, 60);

    expect(subject).toBe("Reset your Lipi password");
    expect(text).toContain(url);
    expect(text).toContain("60 minutes");
    expect(html).toContain('lang="en"');
    expect(html).toContain("60 minutes");
  });

  it("escapes the link inside html attributes", () => {
    const { html } = buildResetPasswordEmail('https://a.test/?a=1&b="2"', 60);

    expect(html).toContain("https://a.test/?a=1&amp;b=&quot;2&quot;");
    expect(html).not.toContain('b="2"');
  });
});
