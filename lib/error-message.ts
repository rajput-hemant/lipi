/** The message of an `Error`, else the stringified thrown value. */
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
