import { describe, expect, it } from 'vitest';
import {
  CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, feedOverride, manualCheckMessage, manualCheckOutcome,
  shortError, shouldOfferMove, versionToPrompt,
} from './update-policy';

describe('timing', () => {
  it('checks soon after launch, then every four hours', () => {
    expect(FIRST_CHECK_DELAY_MS).toBe(10_000);
    expect(CHECK_INTERVAL_MS).toBe(4 * 60 * 60 * 1000);
  });
});

describe('versionToPrompt', () => {
  const idle = { readyVersion: null, askedVersion: null, deviceOpen: false };

  it('has nothing to ask before a download is ready', () => {
    expect(versionToPrompt(idle)).toBeNull();
  });
  it('asks once a download is ready', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0' })).toBe('0.2.0');
  });
  it('holds the question while a Nord is open', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0', deviceOpen: true })).toBeNull();
  });
  it('asks when the Nord is closed again', () => {
    const during = { ...idle, readyVersion: '0.2.0', deviceOpen: true };
    expect(versionToPrompt({ ...during, deviceOpen: false })).toBe('0.2.0');
  });
  it('does not ask twice for the same version in one run', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.2.0', askedVersion: '0.2.0' })).toBeNull();
  });
  it('asks again when a newer version arrives after Later', () => {
    expect(versionToPrompt({ ...idle, readyVersion: '0.3.0', askedVersion: '0.2.0' })).toBe('0.3.0');
  });
});

describe('manualCheckOutcome', () => {
  const base = { current: '0.1.0', available: null, readyVersion: null, deviceOpen: false, error: null };

  it('reports up to date', () => {
    expect(manualCheckOutcome(base)).toEqual({ kind: 'up-to-date', current: '0.1.0' });
  });
  it('reports a download in progress', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0' })).toEqual({ kind: 'downloading', version: '0.2.0' });
  });
  it('offers the restart when the download is ready', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', readyVersion: '0.2.0' })).toEqual({ kind: 'ready', version: '0.2.0' });
  });
  it('does not offer a restart while a Nord is open', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', readyVersion: '0.2.0', deviceOpen: true }))
      .toEqual({ kind: 'ready-on-quit', version: '0.2.0' });
  });
  it('reports the error, ahead of anything else', () => {
    expect(manualCheckOutcome({ ...base, available: '0.2.0', error: 'net::ERR_INTERNET_DISCONNECTED' }))
      .toEqual({ kind: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
  });
});

describe('manualCheckMessage', () => {
  it('names the current version when up to date', () => {
    expect(manualCheckMessage({ kind: 'up-to-date', current: '0.1.0' }).detail).toContain('0.1.0');
  });
  it('names the version being downloaded', () => {
    expect(manualCheckMessage({ kind: 'downloading', version: '0.2.0' }).message).toContain('0.2.0');
  });
  it('tells a connected player the update waits for them', () => {
    expect(manualCheckMessage({ kind: 'ready-on-quit', version: '0.2.0' }).detail).toMatch(/quit/i);
  });
  it('explains a failure in plain words and keeps the technical reason', () => {
    const { message, detail } = manualCheckMessage({ kind: 'error', message: 'net::ERR_INTERNET_DISCONNECTED' });
    expect(message).toMatch(/couldn.t check/i);
    expect(detail).toContain('net::ERR_INTERNET_DISCONNECTED');
  });
  it('never uses updater jargon', () => {
    const outcomes = [
      { kind: 'up-to-date', current: '0.1.0' }, { kind: 'downloading', version: '0.2.0' },
      { kind: 'ready', version: '0.2.0' }, { kind: 'ready-on-quit', version: '0.2.0' },
      { kind: 'error', message: 'x' },
    ] as const;
    for (const o of outcomes) {
      const { message, detail } = manualCheckMessage(o);
      expect(`${message} ${detail.replace('x', '')}`).not.toMatch(/feed|asar|squirrel|yml/i);
    }
  });
});

describe('shouldOfferMove', () => {
  it('offers on a packaged Mac app outside Applications', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: true, inApplications: false })).toBe(true);
  });
  it('does not offer once it is in Applications', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: true, inApplications: true })).toBe(false);
  });
  it('does not offer in development', () => {
    expect(shouldOfferMove({ platform: 'darwin', packaged: false, inApplications: false })).toBe(false);
  });
  it('does not offer on Windows', () => {
    expect(shouldOfferMove({ platform: 'win32', packaged: true, inApplications: false })).toBe(false);
  });
});

describe('feedOverride', () => {
  it('is off by default', () => expect(feedOverride({})).toBeNull());
  it('accepts an http(s) URL', () => {
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'http://localhost:8765/' })).toBe('http://localhost:8765/');
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'https://example.test/feed' })).toBe('https://example.test/feed');
  });
  it('ignores junk rather than breaking startup', () => {
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'not a url' })).toBeNull();
    expect(feedOverride({ OPENNORD_UPDATE_FEED: 'file:///etc' })).toBeNull();
    expect(feedOverride({ OPENNORD_UPDATE_FEED: '' })).toBeNull();
  });
});

describe('shortError', () => {
  // GitHub's "no release" error carries the whole releases feed after its first line.
  const github = `Cannot parse releases feed: Unable to find latest version on GitHub\n<?xml version="1.0"?>\n<feed>${'x'.repeat(30_000)}</feed>`;

  it('keeps only the first line', () => {
    expect(shortError(github)).toBe('Cannot parse releases feed: Unable to find latest version on GitHub');
  });
  it('caps a long single line', () => {
    const out = shortError('y'.repeat(5_000));
    expect(out.length).toBeLessThanOrEqual(300);
    expect(out.endsWith('…')).toBe(true);
  });
  it('leaves a short message alone', () => {
    expect(shortError('net::ERR_INTERNET_DISCONNECTED')).toBe('net::ERR_INTERNET_DISCONNECTED');
  });
  it('keeps the manual-check dialog readable when the error is huge', () => {
    const { detail } = manualCheckMessage({ kind: 'error', message: github });
    expect(detail.length).toBeLessThan(500);
    expect(detail).not.toContain('<feed>');
  });
});
