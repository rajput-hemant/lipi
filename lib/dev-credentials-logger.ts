import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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

export async function logLocalDevCredentials() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!isLoopbackDatabaseUrl(databaseUrl)) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const fixturePath = join(__dirname, "../fixtures/local-dev-credentials.json");

  const credentials = JSON.parse(
    readFileSync(fixturePath, "utf-8")
  ) as LocalDevCredentials;
  const { user, database } = credentials;

  console.log("\n=== Local development credentials ===");
  console.log(
    `Database: postgresql://${database.user}:********@${database.host}:${database.port}/${database.name}`
  );
  console.log(`User:     ${user.email}`);
  console.log(`Password: ${user.password}`);
  console.log("=====================================\n");
}

logLocalDevCredentials();
