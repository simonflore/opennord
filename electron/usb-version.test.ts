import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// usb 2.18+ builds libusb with Windows hotplug, which breaks the UsbDk backend
// (see nord-usb.ts). Keep the pin, in package.json and in what actually installs.
describe('node-usb pin', () => {
  it('stays on usb 2.17.0', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { optionalDependencies: Record<string, string> };
    expect(pkg.optionalDependencies.usb).toBe('2.17.0');
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8')) as { packages: Record<string, { version?: string }> };
    expect(lock.packages['node_modules/usb']?.version).toBe('2.17.0');
  });

  // usb is an optional dependency: an install without it (--omit=optional, or a
  // platform it has no build for) is legitimate and must not fail the suite.
  it('is what actually installs, when it is installed', () => {
    const require = createRequire(import.meta.url);
    let installed: string | null = null;
    try {
      installed = (require('usb/package.json') as { version: string }).version;
    } catch {
      return;
    }
    expect(installed).toBe('2.17.0');
  });
});
