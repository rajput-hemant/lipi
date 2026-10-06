import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Features } from "./features";
import { OpenSource } from "./open-source";
import { TechStack } from "./tech-stack";

vi.mock("@/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils")>()),
  getGitHubStars: vi.fn().mockResolvedValue(0),
}));

describe("lobby section copy contrast", () => {
  it("uses foreground text on the muted tech stack and open source panels", async () => {
    const techStack = renderToStaticMarkup(<TechStack />);
    const openSource = renderToStaticMarkup(await OpenSource());

    expect(techStack).toContain('<p class="max-w-[85%] text-foreground');
    expect(openSource).toContain('<p class="max-w-[85%] text-foreground');
  });

  it("uses foreground text on the search shortcut hint in the features preview", () => {
    const html = renderToStaticMarkup(<Features />);
    const hint = html.match(/<kbd[^>]*>⌘K<\/kbd>/)?.[0] ?? "";

    expect(hint).toContain("text-foreground");
    expect(hint).not.toContain("text-muted-foreground");
  });
});
