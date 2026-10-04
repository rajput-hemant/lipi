import { isLoopbackDatabaseUrl } from "./db/database-url";
import { loadLocalDevCredentials } from "./db/local-dev-credentials";

export function logLocalDevCredentials() {
  if (!isLoopbackDatabaseUrl(process.env.DATABASE_URL)) return;

  const { user, database } = loadLocalDevCredentials();

  console.log("\n=== Local development account ===");
  console.log(
    `Database: postgresql://${database.user}:********@${database.host}:${database.port}/${database.name}`
  );
  console.log(`User:     ${user.email}`);
  console.log("=================================\n");
}
