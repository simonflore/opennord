/** Normalize any thrown value to a human-readable string (Error → message, else String()). */
export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
