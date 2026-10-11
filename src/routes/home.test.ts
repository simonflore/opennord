// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@tanstack/react-router';
import { HomeRoute } from './home';

type Win = { Capacitor?: unknown; nordNativeUsb?: unknown };
const beforeLoad = HomeRoute.options.beforeLoad as unknown as () => void;

function landing(): unknown {
  try {
    beforeLoad();
    return undefined;
  } catch (e) {
    return e;
  }
}

afterEach(() => {
  delete (window as unknown as Win).Capacitor;
  delete (window as unknown as Win).nordNativeUsb;
});

describe('HomeRoute', () => {
  it('shows the landing page in a browser', () => {
    expect(landing()).toBeUndefined();
  });
  it('opens the iPad app on the Library', () => {
    (window as unknown as Win).Capacitor = { isNativePlatform: () => true };
    const thrown = landing();
    expect(isRedirect(thrown)).toBe(true);
    expect((thrown as { options: { to: string } }).options.to).toBe('/library/programs');
  });
  it('opens the desktop app on the Library', () => {
    (window as unknown as Win).nordNativeUsb = {};
    expect(isRedirect(landing())).toBe(true);
  });
});
