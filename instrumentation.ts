export async function register() {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logLocalDevCredentials } =
    await import("./lib/dev-credentials-logger");
  logLocalDevCredentials();
}
