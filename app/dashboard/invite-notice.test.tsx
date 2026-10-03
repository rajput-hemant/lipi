import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InviteNotice, isInvalidInvite } from "./invite-notice";

describe("invite notice", () => {
  it("only reacts to the exact invalid flag", () => {
    expect(isInvalidInvite("invalid")).toBe(true);
    expect(isInvalidInvite(["invalid"])).toBe(false);
    expect(isInvalidInvite(undefined)).toBe(false);
  });

  it("renders an alert explaining the failed invite", () => {
    const html = renderToStaticMarkup(<InviteNotice className="mb-6" />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("invalid or has expired");
    expect(html).toContain("mb-6");
  });
});
