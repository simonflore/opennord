// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { router } from './router';
import { LibraryIndexRoute, ProgramsRoute } from './routes/library';
import { PresetsRoute } from './routes/presets';
import { PianosRoute } from './routes/pianos';
import { SamplesRoute, SamplesRedirectRoute } from './routes/samples';
import { DeviceRoute } from './routes/device';
import { AboutRoute } from './routes/about';
import { InspectRoute, DecodeRoute, KitRoute } from './routes/dev';

describe('router', () => {
  it('registers the core screen paths', () => {
    // TanStack stores route paths without the leading slash.
    expect(LibraryIndexRoute.path).toBe('library');
    // Each list is one route with an optional id: the list, or an entry open beside it.
    expect(ProgramsRoute.path).toBe('library/programs/{-$programId}');
    expect(PresetsRoute.path).toBe('library/presets/{-$presetId}');
    expect(PianosRoute.path).toBe('library/pianos/{-$pianoId}');
    expect(SamplesRedirectRoute.path).toBe('samples');
    expect(SamplesRoute.path).toBe('library/samples/{-$sampleId}');
    expect(DeviceRoute.path).toBe('device');
    expect(AboutRoute.path).toBe('about');
    expect(InspectRoute.path).toBe('dev/inspect');
    expect(DecodeRoute.path).toBe('dev/decode');
    expect(KitRoute.path).toBe('dev/kit');
  });

  it('matches a list and an entry on the same route', () => {
    const match = (path: string) => router.matchRoutes(path).at(-1);
    expect(match('/library/presets')?.routeId).toBe(PresetsRoute.id);
    expect(match('/library/presets/folder%3Aa.ns4o')?.routeId).toBe(PresetsRoute.id);
    expect(match('/library/presets/folder%3Aa.ns4o')?.params).toMatchObject({ presetId: 'folder:a.ns4o' });
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

describe('program list ?source=', () => {
  const validate = ProgramsRoute.options.validateSearch as (s: Record<string, unknown>) => { source?: string };
  it('keeps a known source and drops anything else', () => {
    expect(validate({ source: 'nord' })).toEqual({ source: 'nord' });
    expect(validate({ source: 'local' })).toEqual({ source: 'local' });
    expect(validate({ source: 'bogus' })).toEqual({});
    expect(validate({ source: 'toString' })).toEqual({}); // not an inherited key
    expect(validate({})).toEqual({});
  });
});
