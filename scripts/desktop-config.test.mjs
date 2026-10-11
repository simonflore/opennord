import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const { build, scripts } = pkg;

describe('desktop build config', () => {
  it('ships under the shared bundle id', () => {
    expect(build.appId).toBe('org.opennord.app');
  });

  it('names assets without a version, so releases/latest/download/<name> is stable', () => {
    expect(build.mac.artifactName).toBe('OpenNord-mac.${ext}');
    expect(build.nsis.artifactName).toBe('OpenNord-win-x64.${ext}');
  });

  it('builds a dmg and a zip for macOS (the zip is what the updater reads)', () => {
    expect(build.mac.target).toEqual(['dmg', 'zip']);
  });

  it('builds a per-user NSIS installer for Windows', () => {
    expect(build.win.target).toBe('nsis');
    expect(build.nsis.perMachine).toBe(false);
  });

  it('points the update feed at the public repo', () => {
    expect(build.publish).toEqual([{ provider: 'github', owner: 'simonflore', repo: 'opennord' }]);
  });

  it('never lets electron-builder publish by itself', () => {
    expect(scripts['electron:pack']).toContain('--publish never');
    expect(scripts['electron:pack:win']).toContain('--publish never');
  });

  it('keeps the node-usb fences', () => {
    expect(build.npmRebuild).toBe(false);
    expect(build.files).toContain('!**/node_modules/usb/build/**');
    expect(scripts['electron:pack:win']).toContain('--x64');
  });
});
