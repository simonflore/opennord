/**
 * The release channel and build, for the beta label and for bug reports.
 * `__BUILD__` is set by build-info.ts at build time; unit tests don't define it.
 */
const info = typeof __BUILD__ !== 'undefined' ? __BUILD__ : undefined;

export const CHANNEL = 'beta';
export const BUILD: number | null = info?.build ?? null;
export const COMMIT: string | null = info?.commit ?? null;

/** What a player reads and quotes: "beta 412", or the commit when there's no number. */
export const VERSION_LABEL = `${CHANNEL} ${BUILD ?? COMMIT ?? 'dev'}`;

/** The exact build for a bug report: "OpenNord beta 412 (a1b2c3d)". */
export const VERSION_FULL = `OpenNord ${VERSION_LABEL}${BUILD != null && COMMIT ? ` (${COMMIT})` : ''}`;
