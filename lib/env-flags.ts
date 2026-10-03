export function isEnvValidationSkipped(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "true";
}
