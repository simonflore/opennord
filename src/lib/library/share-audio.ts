import type { CommunityClient } from '../capabilities/types';
import { copyHere, type Mergeable } from './found-on';

/**
 * The copy "Share to community" shares for a sample or piano, when it is
 * offered: one of your own, held as a file on this computer (the copy here, as
 * the Library shares a program). Never one still on the Nord or only in the
 * cloud (no file here) and never factory content. This only decides what is
 * offered; the share form and the server run the real check on the bytes.
 */
export function audioToShare(
  community: CommunityClient,
  entry: Mergeable & { bytes?: Uint8Array; factory?: unknown; isFactory?: boolean },
): { id: string } | undefined {
  if (!community.available || !community.samples || !entry.bytes || entry.factory || entry.isFactory) return undefined;
  return copyHere(entry);
}
