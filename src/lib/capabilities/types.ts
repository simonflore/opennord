import type { ProgramRanker } from '../ai/search';

export type { ProgramRanker };

/** A signed-in user. `id` is the identity provider subject (Zitadel `sub`). */
export interface UserIdentity {
  id: string;
  email?: string;
  displayName?: string;
}

/** Identity capability. The local build ships a logged-out stub; the product
 *  build supplies a Zitadel OIDC/PKCE implementation. */
export interface AuthProvider {
  /** Current user, or null when logged out. */
  getUser(): UserIdentity | null;
  /** Begin sign-in; resolves once authenticated. */
  signIn(): Promise<UserIdentity>;
  signOut(): Promise<void>;
  /** Observe auth changes; returns an unsubscribe function. */
  subscribe(listener: (user: UserIdentity | null) => void): () => void;
}

/** Cloud backup/sync of the user layer. Minimal here; the full surface lives in
 *  the opennord-contracts package and the product implementation. */
export interface CloudSync {
  readonly available: boolean;
}

/** Community browse/publish/download. Minimal here for the same reason. */
export interface CommunityClient {
  readonly available: boolean;
}

/**
 * A structured diagnostic event — chiefly device-connect outcomes, so failures
 * on models we can't test locally (e.g. a user's Stage 2 EX) reach us with the
 * device's actual USB layout instead of a screenshot days later. Payloads are
 * descriptor/metadata only — never program content or PII.
 */
export interface DiagnosticEvent {
  /** Event kind, e.g. 'device.connect' | 'device.error'. */
  kind: string;
  /** Whether the operation succeeded (omit for informational events). */
  ok?: boolean;
  /** Human-readable summary (used as the log line). */
  message: string;
  /** Structured detail: USB descriptor snapshot, error name/message, model guess, etc. */
  detail?: Record<string, unknown>;
}

/**
 * Diagnostics sink. The local build logs to the console; the product build
 * supplies an implementation that ships events to the backend so they surface
 * in the server (Coolify) logs. Never throws — diagnostics must not break a
 * user flow.
 */
export interface Diagnostics {
  record(event: DiagnosticEvent): void;
}

/** The full set of pluggable capabilities the UI consumes through the seam. */
export interface Capabilities {
  auth: AuthProvider;
  cloud: CloudSync;
  community: CommunityClient;
  ranker: ProgramRanker;
  diagnostics: Diagnostics;
}
