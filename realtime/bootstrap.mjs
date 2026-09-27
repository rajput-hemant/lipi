import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = fileURLToPath(new URL("..", import.meta.url));

const jiti = createJiti(import.meta.url, {
  alias: {
    "@": root,
  },
});

await jiti.import("./server.ts");
