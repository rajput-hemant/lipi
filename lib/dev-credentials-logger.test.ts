import { afterEach, describe, expect, it, vi } from "vitest";

import credentials from "../fixtures/local-dev-credentials.json";
import { logLocalDevCredentials } from "./dev-credentials-logger";

describe("logLocalDevCredentials", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs the fixture user for a loopback database", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@127.0.0.1:5432/db");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    logLocalDevCredentials();

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain(credentials.user.email);
    expect(output).toContain(credentials.user.password);
    expect(output).toContain(`:********@${credentials.database.host}`);
  });

  it.each(["", "postgresql://u:p@db.example.com:5432/db"])(
    "logs nothing for DATABASE_URL=%j",
    (url) => {
      vi.stubEnv("DATABASE_URL", url);
      const log = vi.spyOn(console, "log").mockImplementation(() => {});

      logLocalDevCredentials();

      expect(log).not.toHaveBeenCalled();
    }
  );
});
