import { isLoopbackDatabaseUrl } from "./db/database-url";
import { loadLocalDevCredentials } from "./db/local-dev-credentials";

export function logLocalDevCredentials() {
  if (process.env.NODE_ENV === "production") return;
  if (!isLoopbackDatabaseUrl(process.env.DATABASE_URL)) return;

  const { user, database } = loadLocalDevCredentials();

  console.log("\n=== Local development account ===");
  console.log(
    `Database: postgresql://${database.user}:********@${database.host}:${database.port}/${database.name}`
  );
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${user.password}`);
  console.log("=================================\n");
}
