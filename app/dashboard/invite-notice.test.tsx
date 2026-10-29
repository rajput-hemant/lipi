import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InviteNotice, isInvalidInvite } from "./invite-notice";

describe("invite notice", () => {
  it("only reacts to the exact invalid flag", () => {
    expect(isInvalidInvite("invalid")).toBe(true);
    expect(isInvalidInvite("expired")).toBe(true);
    expect(isInvalidInvite("wrong-account")).toBe(true);
    expect(isInvalidInvite("toString")).toBe(false);
    expect(isInvalidInvite(["invalid"])).toBe(false);
    expect(isInvalidInvite(undefined)).toBe(false);
  });

  it("renders an alert explaining the failed invite", () => {
    const html = renderToStaticMarkup(<InviteNotice className="mb-6" />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("This invite is invalid.");
    expect(html).toContain("mb-6");
  });

  it("explains an expired invite and a wrong account", () => {
    expect(renderToStaticMarkup(<InviteNotice reason="expired" />)).toContain(
      "has expired"
    );
    expect(
      renderToStaticMarkup(<InviteNotice reason="wrong-account" />)
    ).toContain("different email address");
  });
});
