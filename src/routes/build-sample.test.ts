// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createAppRouter } from '@/router';

describe('the Build sample route', () => {
  it.each([
    ['/library/samples/build', 'build list'],
    ['/library/samples/build/abc', 'a project'],
  ])('%s matches the build route (%s), not a sample id', (path) => {
    const matches = createAppRouter().matchRoutes(path);
    expect(matches.at(-1)?.routeId).toBe('/library/samples/build/{-$projectId}');
  });

  it('leaves the samples route alone', () => {
    const matches = createAppRouter().matchRoutes('/library/samples/xyz');
    expect(matches.at(-1)?.routeId).toBe('/library/samples/{-$sampleId}');
  });
});
