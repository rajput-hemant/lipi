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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { hideAccordionTriggerIndicator } from "@/lib/shadcn-call-site";
import { cn } from "@/lib/utils";

const roots: ReturnType<typeof createRoot>[] = [];

beforeAll(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("folder accordion trigger call site", () => {
  it("applies hideAccordionTriggerIndicator like folders.tsx folder rows", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    act(() =>
      root.render(
        <Accordion>
          <AccordionItem value="folder">
            <AccordionTrigger
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                hideAccordionTriggerIndicator,
                "justify-start border-none hover:no-underline data-panel-open:bg-secondary"
              )}
            >
              Projects
            </AccordionTrigger>
            <AccordionContent>Files</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    );

    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger?.className).toContain(hideAccordionTriggerIndicator);
    expect(
      trigger?.querySelectorAll('[data-slot="accordion-trigger-icon"]')
    ).toHaveLength(2);
  });
});
