import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_DIRS = ["app", "components", "hooks", "lib"];
const SERVER_ONLY_IMPORT =
  /from\s+["']@\/lib\/db\/(data\/|index["'])|@\/lib\/db["']/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ?
        [path]
      : [];
  });
}

describe("server-only db boundary", () => {
  it("keeps lib/db/data and the db driver out of client components", () => {
    const offenders = SOURCE_DIRS.flatMap(sourceFiles).filter((file) => {
      const source = readFileSync(file, "utf8");
      return (
        /^\s*["']use client["']/m.test(source.slice(0, 200)) &&
        SERVER_ONLY_IMPORT.test(source)
      );
    });
    expect(offenders).toEqual([]);
  });

  it("only exposes use-server modules from lib/db/actions", () => {
    const missing = readdirSync("lib/db/actions")
      .filter((name) => /\.ts$/.test(name) && !/\.test\.ts$/.test(name))
      .filter(
        (name) =>
          !/^\s*["']use server["']/m.test(
            readFileSync(join("lib/db/actions", name), "utf8").slice(0, 200)
          )
      );
    expect(missing).toEqual([]);
  });
});
