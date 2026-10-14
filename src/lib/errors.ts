/** Normalize any thrown value to a human-readable string (Error → message, else String()). */
export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** "Couldn’t save the project: disk full." from a prefix and whatever was thrown, without doubled periods. */
export function describeFailure(prefix: string, e: unknown): string {
  const why = (e == null ? '' : getErrorMessage(e)).trim().replace(/[.\s]+$/, '');
  return why ? `${prefix}: ${why}.` : `${prefix}.`;
}
