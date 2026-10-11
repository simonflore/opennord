import { describe, expect, it } from 'vitest';
import {
  ALLOWED_PERMISSIONS, DEFAULT_SIZE, externalUrlToOpen, isAppOrigin, isAppUrl, isPermissionAllowed,
  notOpenMessage, usableBounds,
} from './shell-policy';

const packed = { fileUrl: 'file:///Applications/OpenNord.app/Contents/Resources/app.asar/dist/index.html', devOrigin: null };
const dev = { fileUrl: packed.fileUrl, devOrigin: 'http://localhost:5173' };

describe('isAppUrl', () => {
  it('recognises the packed app, with any hash route', () => {
    expect(isAppUrl(packed.fileUrl, packed)).toBe(true);
    expect(isAppUrl(`${packed.fileUrl}#/library/programs`, packed)).toBe(true);
  });
  it('recognises the dev server only when one is configured', () => {
    expect(isAppUrl('http://localhost:5173/#/device', dev)).toBe(true);
    expect(isAppUrl('http://localhost:5173/#/device', packed)).toBe(false);
  });
  it('rejects look-alikes', () => {
    expect(isAppUrl('file:///Users/x/evil/dist/index.html', packed)).toBe(false);
    expect(isAppUrl('file:///Applications/OpenNord.app/Contents/Resources/app.asar/dist/other.html', packed)).toBe(false);
    expect(isAppUrl('http://localhost:5174/', dev)).toBe(false);
    expect(isAppUrl('https://localhost:5173/', dev)).toBe(false);
    expect(isAppUrl('http://localhost.evil.test:5173/', dev)).toBe(false);
  });
  it('rejects the web and garbage', () => {
    expect(isAppUrl('https://www.nordkeyboards.com/', packed)).toBe(false);
    expect(isAppUrl('not a url', packed)).toBe(false);
    expect(isAppUrl('', packed)).toBe(false);
  });
});

describe('isAppOrigin', () => {
  it('treats the file origin as the app (navigation is what keeps other files out)', () => {
    expect(isAppOrigin('file:///', packed)).toBe(true);
    expect(isAppOrigin(packed.fileUrl, packed)).toBe(true);
  });
  it('treats the dev origin as the app only in development', () => {
    expect(isAppOrigin('http://localhost:5173', dev)).toBe(true);
    expect(isAppOrigin('http://localhost:5173/', packed)).toBe(false);
  });
  it('rejects the web and garbage', () => {
    expect(isAppOrigin('https://example.com', dev)).toBe(false);
    expect(isAppOrigin('null', packed)).toBe(false);
  });
});

describe('externalUrlToOpen', () => {
  it('passes https links to the browser', () => {
    expect(externalUrlToOpen('https://www.nordkeyboards.com/sound-libraries')).toBe('https://www.nordkeyboards.com/sound-libraries');
  });
  it('opens nothing else', () => {
    for (const url of ['http://example.com/', 'file:///etc/passwd', 'javascript:alert(1)', 'mailto:a@b.c', 'opennord://x', 'smb://host/share', 'not a url', '']) {
      expect(externalUrlToOpen(url)).toBeNull();
    }
  });
});

describe('isPermissionAllowed', () => {
  it('allows exactly what the app uses', () => {
    expect([...ALLOWED_PERMISSIONS].sort()).toEqual(['clipboard-sanitized-write', 'fileSystem', 'midi']);
    for (const p of ALLOWED_PERMISSIONS) expect(isPermissionAllowed(p, 'file:///', packed)).toBe(true);
  });
  it('refuses everything else, including raw device access and sysex', () => {
    for (const p of ['midiSysex', 'usb', 'hid', 'serial', 'media', 'geolocation', 'notifications', 'clipboard-read', 'openExternal', 'unknown']) {
      expect(isPermissionAllowed(p, 'file:///', packed)).toBe(false);
    }
  });
  it('refuses an allowed permission to anyone but the app', () => {
    expect(isPermissionAllowed('midi', 'https://example.com', packed)).toBe(false);
  });
});

describe('usableBounds', () => {
  const laptop = { x: 0, y: 0, width: 1512, height: 944 };
  const external = { x: 1512, y: -200, width: 2560, height: 1415 };

  it('keeps bounds that are on a connected display', () => {
    const saved = { x: 100, y: 80, width: 1300, height: 800 };
    expect(usableBounds(saved, [laptop])).toEqual(saved);
  });
  it('keeps bounds on a second display', () => {
    const saved = { x: 1800, y: 0, width: 1400, height: 900 };
    expect(usableBounds(saved, [laptop, external])).toEqual(saved);
  });
  it('drops bounds whose display has gone', () => {
    expect(usableBounds({ x: 1800, y: 0, width: 1400, height: 900 }, [laptop])).toBeNull();
  });
  it('drops bounds that only peek onto a display by a sliver', () => {
    expect(usableBounds({ x: 1500, y: 0, width: 1400, height: 900 }, [laptop])).toBeNull();
  });
  it('drops nonsense', () => {
    for (const saved of [null, undefined, 'x', {}, { x: 0, y: 0, width: 10, height: 10 }, { x: NaN, y: 0, width: 900, height: 700 }, { x: 0, y: 0, width: '900', height: 700 }]) {
      expect(usableBounds(saved, [laptop])).toBeNull();
    }
  });
  it('has a sensible default size', () => {
    expect(DEFAULT_SIZE).toEqual({ width: 1200, height: 820 });
  });
});

describe('notOpenMessage', () => {
  it('says the Nord was disconnected after an unplug', () => {
    expect(notOpenMessage(true)).toBe('Your Nord was disconnected.');
  });
  it('keeps the plain message when nothing was ever opened', () => {
    expect(notOpenMessage(false)).toBe('Device not open.');
  });
});
