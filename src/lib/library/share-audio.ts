import type { CommunityClient } from '../capabilities/types';
import type { LibrarySource } from './types';

/**
 * Whether "Share to community" is offered for a sample or piano: one of your
 * own, held as a file. Never one still on the Nord (no bytes here) and never
 * factory content. This only decides what is offered; the share form and the
 * server run the real check on the bytes.
 */
export function canShareAudio(
  community: CommunityClient,
  entry: { bytes?: Uint8Array; source: LibrarySource; factory?: unknown; isFactory?: boolean },
): boolean {
  return community.available && !!community.samples && !!entry.bytes && entry.source !== 'nord' && !entry.factory && !entry.isFactory;
}
