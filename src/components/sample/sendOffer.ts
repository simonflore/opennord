import { foundOn } from '@/lib/library/found-on';
import type { LibrarySource } from '@/lib/library/types';

/**
 * Whether Send to Nord is on offer for the open sample: only one the Nord doesn't
 * have yet (not found on it at all, so a local copy of a Nord sample doesn't count),
 * and never Nord factory content.
 */
export function canOfferSend(entry: { source: LibrarySource; sources?: LibrarySource[] } | undefined, factory: boolean | undefined): boolean {
  return !!entry && !factory && !foundOn(entry).includes('nord');
}

/** Why Send waits on a sample while another one is on its way. */
export const ANOTHER_SENDING = 'Another sample is on its way to your Nord.';

/**
 * What the open sample shows of the current send: its status, and "Sending…" on its
 * Send, only when the send belongs to it (`sentFor`, the sample it was started on).
 * Another sample opened mid-send shows neither; its Send waits. The status stays
 * after the send, also once the Nord is gone, for the sample it belongs to.
 */
export function sendShownFor(
  openId: string | undefined, sentFor: string | undefined, send: { status: string; busy: boolean },
): { status: string | undefined; busyReason: string | undefined } {
  const own = openId !== undefined && openId === sentFor;
  return {
    status: own && send.status ? send.status : undefined,
    busyReason: send.busy ? (own ? 'Sending…' : ANOTHER_SENDING) : undefined,
  };
}

/** Whether opening `openId` lets go of the send's status: a finished send, for another sample. */
export function clearsSendOnOpen(openId: string | undefined, sentFor: string | undefined, busy: boolean): boolean {
  return !busy && openId !== sentFor;
}
