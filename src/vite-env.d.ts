/// <reference types="vite/client" />

/** Build flag: true on web/dev, false on the native (Capacitor/iOS) build.
 *  Gates RE-only tooling (the /contribute + /dev routes). */
declare const __RE__: boolean;

/** Build identity, from build-info.ts. Undefined in unit tests (see lib/version.ts). */
declare const __BUILD__: { build: number | null; commit: string | null } | undefined;
