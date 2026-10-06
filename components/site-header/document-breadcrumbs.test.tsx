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

import type { DocumentSummary } from "@/types/db";

import { DocumentBreadcrumbs } from "./document-breadcrumbs";

type MockWorkspace = {
  id: string;
  title: string;
  iconId: string | null;
};

type MockAppState = {
  documents: DocumentSummary[];
  workspace: MockWorkspace | null;
};

let mockPathname = "/dashboard/ws-1";
let mockAppState: MockAppState = {
  documents: [],
  workspace: {
    id: "ws-1",
    title: "Acme Corp",
    iconId: "💼",
  },
};

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/hooks/use-app-state", () => ({
  useAppState: () => mockAppState,
}));

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("DocumentBreadcrumbs", () => {
  it("renders workspace title on workspace root", () => {
    mockPathname = "/dashboard/ws-1";
    mockAppState = {
      documents: [],
      workspace: { id: "ws-1", title: "Acme Corp", iconId: "💼" },
    };

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<DocumentBreadcrumbs />);
    });

    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("aria-label")).toBe("Breadcrumb");
    expect(nav?.textContent).toContain("Acme Corp");
  });

  it("renders workspace title and document title on a document page", () => {
    mockPathname = "/dashboard/ws-1/doc-1";
    mockAppState = {
      documents: [
        {
          id: "doc-1",
          workspaceId: "ws-1",
          parentId: null,
          title: "Architecture Doc",
          icon: "",
          bannerUrl: null,
          inTrash: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      workspace: { id: "ws-1", title: "Engineering", iconId: "⚙️" },
    };

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(<DocumentBreadcrumbs />);
    });

    const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("aria-label")).toBe("Breadcrumb");
    expect(nav?.textContent).toContain("Engineering");
    expect(nav?.textContent).toContain("Architecture Doc");
  });
});
