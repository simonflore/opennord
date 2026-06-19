// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { router } from './router';
import { LibraryRoute, ProgramRoute } from './routes/library';
import { SamplesRoute } from './routes/samples';
import { DeviceRoute } from './routes/device';
import { AboutRoute } from './routes/about';
import { InspectRoute, DecodeRoute } from './routes/dev';

describe('router', () => {
  it('registers the core screen paths', () => {
    // TanStack stores route paths without the leading slash.
    expect(LibraryRoute.path).toBe('library');
    expect(ProgramRoute.path).toBe('library/$programId');
    expect(SamplesRoute.path).toBe('samples');
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
