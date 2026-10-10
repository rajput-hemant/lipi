import { expect, it } from "vitest";
import { z } from "zod";

import "./providers";

it("disables Zod JIT compilation so strict CSPs see no eval probe", () => {
  expect(z.core.globalConfig.jitless).toBe(true);
});
