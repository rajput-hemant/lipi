import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const composeFile = process.env.LOCAL_DEV_COMPOSE;

if (!composeFile || !existsSync(resolve(composeFile))) {
  console.error(
    "Set LOCAL_DEV_COMPOSE to the shared resource-only docker-compose.yml (owned by Infinitunes). See docs/local-development.md"
  );
  process.exit(1);
}

const proc = spawnSync(
  "docker",
  ["compose", "-f", resolve(composeFile), ...process.argv.slice(2)],
  { stdio: "inherit" }
);
process.exit(proc.status ?? 1);
