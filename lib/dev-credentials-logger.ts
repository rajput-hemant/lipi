import { readFileSync } from "fs";
import { join } from "path";

import { isLoopbackDatabaseUrl } from "./db/database-url";

interface LocalDevCredentials {
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

export function logLocalDevCredentials() {
  if (!isLoopbackDatabaseUrl(process.env.DATABASE_URL)) return;

  const fixturePath = join(
    process.cwd(),
    "fixtures/local-dev-credentials.json"
  );
  const { user, database } = JSON.parse(
    readFileSync(fixturePath, "utf-8")
  ) as LocalDevCredentials;

  console.log("\n=== Local development credentials ===");
  console.log(
    `Database: postgresql://${database.user}:********@${database.host}:${database.port}/${database.name}`
  );
  console.log(`User:     ${user.email}`);
  console.log(`Password: ${user.password}`);
  console.log("=====================================\n");
}
