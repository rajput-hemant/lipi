import { readFileSync } from "fs";
import { join } from "path";

export interface LocalDevCredentials {
  user: {
    id: string;
    email: string;
    password: string;
    name: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
  };
}

export function loadLocalDevCredentials(): LocalDevCredentials {
  const fixturePath = join(
    process.cwd(),
    "fixtures/local-dev-credentials.json"
  );
  return JSON.parse(readFileSync(fixturePath, "utf-8")) as LocalDevCredentials;
}
