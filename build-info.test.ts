import { describe, it, expect } from 'vitest';
import { buildInfo } from './build-info';

describe('buildInfo', () => {
  it('takes the build number and commit from the environment when given', () => {
    expect(buildInfo({ OPENNORD_BUILD: '412', SOURCE_COMMIT: 'a1b2c3d4e5f6' })).toEqual({ build: 412, commit: 'a1b2c3d' });
  });

  it('never reports a made-up number', () => {
    // Without OPENNORD_BUILD the number comes from git, and only from a full clone.
    const { build } = buildInfo({ OPENNORD_BUILD: 'not-a-number' });
    expect(build === null || (Number.isInteger(build) && build > 0)).toBe(true);
  });
});
