import { expect, it } from "vitest";
import * as z from "zod";

import "./instrumentation-client";

it("disables Zod JIT compilation so strict CSPs see no eval probe", () => {
  expect(z.core.globalConfig.jitless).toBe(true);
});
