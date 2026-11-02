import { describe, expect, it } from 'vitest';
import { ANOTHER_SENDING, canOfferSend, clearsSendOnOpen, sendShownFor } from './sendOffer';

describe('canOfferSend', () => {
  it('offers a sample of your own that the Nord does not have', () => {
    expect(canOfferSend({ source: 'local' }, false)).toBe(true);
    expect(canOfferSend({ source: 'cloud' }, false)).toBe(true);
  });
  it('does not offer one read off the Nord', () => {
    expect(canOfferSend({ source: 'nord' }, false)).toBe(false);
  });
  it('does not offer a local sample that is also on the Nord', () => {
    expect(canOfferSend({ source: 'local', sources: ['local', 'nord'] }, false)).toBe(false);
  });
  it('never offers factory content', () => {
    expect(canOfferSend({ source: 'local' }, true)).toBe(false);
  });
  it('does not offer without an entry', () => {
    expect(canOfferSend(undefined, false)).toBe(false);
  });
});

describe('sendShownFor', () => {
  const sending = { status: 'Sending to your Nord… 40%', busy: true };
  it('shows the progress and “Sending…” on the sample being sent', () => {
    expect(sendShownFor('a', 'a', sending)).toEqual({ status: 'Sending to your Nord… 40%', busyReason: 'Sending…' });
  });
  it('shows neither under another sample opened mid-send; its Send waits', () => {
    expect(sendShownFor('b', 'a', sending)).toEqual({ status: undefined, busyReason: ANOTHER_SENDING });
  });
  it('keeps the outcome on its own sample after the send, even once the Nord is gone', () => {
    expect(sendShownFor('a', 'a', { status: 'Your Nord stopped answering.', busy: false }))
      .toEqual({ status: 'Your Nord stopped answering.', busyReason: undefined });
    expect(sendShownFor('b', 'a', { status: 'Your Nord stopped answering.', busy: false }))
      .toEqual({ status: undefined, busyReason: undefined });
  });
  it('shows nothing when no sample was sent, or none is open', () => {
    expect(sendShownFor('a', undefined, { status: 'x', busy: false }).status).toBeUndefined();
    expect(sendShownFor(undefined, undefined, { status: 'x', busy: false }).status).toBeUndefined();
  });
});

describe('clearsSendOnOpen', () => {
  it('keeps a send’s status while it runs, and when its own sample opens again', () => {
    expect(clearsSendOnOpen('b', 'a', true)).toBe(false);
    expect(clearsSendOnOpen('a', 'a', false)).toBe(false);
  });
  it('lets go of a finished send’s status when another sample opens', () => {
    expect(clearsSendOnOpen('b', 'a', false)).toBe(true);
    expect(clearsSendOnOpen(undefined, 'a', false)).toBe(true);
  });
});
