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

/** The full set of pluggable capabilities the UI consumes through the seam. */
export interface Capabilities {
  auth: AuthProvider;
  cloud: CloudSync;
  community: CommunityClient;
  ranker: ProgramRanker;
}
