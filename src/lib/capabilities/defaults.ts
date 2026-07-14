import { naiveRanker } from '../ai/search';
import type {
  AuthProvider,
  Capabilities,
  CloudSync,
  CommunityClient,
  DiagnosticEvent,
  Diagnostics,
} from './types';

/** Logged-out, no-network identity. Sign-in is only possible in the cloud build. */
export const localAuth: AuthProvider = {
  getUser: () => null,
  async signIn() {
    throw new Error('Sign-in requires the OpenNord cloud, which is not part of the local build.');
  },
  async signOut() {},
  subscribe: () => () => {},
};

export const noopCloud: CloudSync = { available: false };
export const noopCommunity: CommunityClient = { available: false };

/**
 * Console diagnostics — the local default. Prints one structured line per event
 * (errors as `console.error`, everything else as `console.info`) so failures are
 * at least visible in the browser devtools. Never throws.
 */
export const consoleDiagnostics: Diagnostics = {
  record(event: DiagnosticEvent) {
    try {
      const line = `[diag] ${event.kind}: ${event.message}`;
      if (event.ok === false) console.error(line, event.detail ?? {});
      else console.info(line, event.detail ?? {});
    } catch {
      /* diagnostics must never break a flow */
    }
  },
};

/**
 * HTTP diagnostics — POSTs each event as JSON to `url` (fire-and-forget,
 * `keepalive` so it survives a page navigation). The product build wires this to
 * the backend's ingest endpoint, which logs the payload to stdout so it lands in
 * the server (Coolify) logs. Falls back to console on a failed send. Never throws.
 */
export function httpDiagnostics(url: string): Diagnostics {
  return {
    record(event: DiagnosticEvent) {
      try {
        void fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...event, at: new Date().toISOString(), ua: navigator.userAgent }),
          keepalive: true,
        }).catch(() => consoleDiagnostics.record(event));
      } catch {
        consoleDiagnostics.record(event);
      }
    },
  };
}

/** Capabilities for the free, local-only build: nothing networked, naive search. */
export const localCapabilities: Capabilities = {
  auth: localAuth,
  cloud: noopCloud,
  community: noopCommunity,
  ranker: naiveRanker,
  diagnostics: consoleDiagnostics,
};
