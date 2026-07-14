// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { router } from './router';
import { LibraryIndexRoute, ProgramsRoute, ProgramRoute } from './routes/library';
import { SamplesRoute, SamplesRedirectRoute } from './routes/samples';
import { DeviceRoute } from './routes/device';
import { AboutRoute } from './routes/about';
import { InspectRoute, DecodeRoute } from './routes/dev';

describe('router', () => {
  it('registers the core screen paths', () => {
    // TanStack stores route paths without the leading slash.
    expect(LibraryIndexRoute.path).toBe('library');
    expect(ProgramsRoute.path).toBe('library/programs');
    expect(ProgramRoute.path).toBe('library/programs/$programId');
    expect(SamplesRedirectRoute.path).toBe('samples');
    expect(SamplesRoute.path).toBe('library/samples');
    expect(DeviceRoute.path).toBe('device');
    expect(AboutRoute.path).toBe('about');
    expect(InspectRoute.path).toBe('dev/inspect');
    expect(DecodeRoute.path).toBe('dev/decode');
  });

  it('is configured with a hash history (Capacitor-safe)', async () => {
    expect(router.history).toBeDefined();
    // Hash history serializes the route into location.hash, leaving the real
    // pathname at '/', which is what makes deep links survive a non-http origin.
    router.history.push('/about');
    expect(router.history.location.pathname).toBe('/about');
    expect(window.location.pathname).toBe('/');
  });
});
