/// <reference types="vite/client" />

/** Build flag: true on web/dev, false on the native (Capacitor/iOS) build.
 *  Gates RE-only tooling (Contribute capture, inference, /contribute + /dev routes). */
declare const __RE__: boolean;
