import { naiveRanker } from '../ai/search';
import type { AuthProvider, Capabilities, CloudSync, CommunityClient } from './types';

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

/** Capabilities for the free, local-only build: nothing networked, naive search. */
export const localCapabilities: Capabilities = {
  auth: localAuth,
  cloud: noopCloud,
  community: noopCommunity,
  ranker: naiveRanker,
};
