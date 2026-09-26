export function assertDatabaseUrlConfigured(databaseUrl: string | undefined) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_ENV_VALIDATION !== "true" &&
    !databaseUrl
  ) {
    throw new Error("Database URL is invalid or missing");
  }
}
