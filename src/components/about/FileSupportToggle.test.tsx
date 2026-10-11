// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FileSupportToggle } from './FileSupportToggle';
import { AboutView } from './AboutView';
import { CapabilitiesProvider } from '../../lib/capabilities/CapabilitiesContext';
import { FILE_SUPPORT_PREF_KEY } from '../../lib/diagnostics/file-support-pref';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('FileSupportToggle', () => {
  it('is off by default and says plainly what is and is never sent', () => {
    render(<FileSupportToggle />);
    const toggle = screen.getByRole('switch', { name: /help improve file support/i });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/program names and file names? are never sent/i)).toBeInTheDocument();
    // The local build has no server: say where reports go.
    expect(screen.getByText(/isn’t connected to a server/i)).toBeInTheDocument();
  });

  it('stores the choice on this device', () => {
    render(<FileSupportToggle />);
    fireEvent.click(screen.getByRole('switch', { name: /help improve file support/i }));
    expect(localStorage.getItem(FILE_SUPPORT_PREF_KEY)).toBe('on');
    expect(screen.getByRole('switch', { name: /help improve file support/i })).toBeChecked();
    fireEvent.click(screen.getByRole('switch', { name: /help improve file support/i }));
    expect(localStorage.getItem(FILE_SUPPORT_PREF_KEY)).toBeNull();
  });

  it('drops the console note when reports go to a server', () => {
    render(
      <CapabilitiesProvider value={{ diagnostics: { remote: true, record: () => {} } }}>
        <FileSupportToggle />
      </CapabilitiesProvider>,
    );
    expect(screen.queryByText(/isn’t connected to a server/i)).toBeNull();
  });
});

describe('AboutView privacy', () => {
  it('describes connection reports only in a build that sends them', () => {
    const { unmount } = render(<AboutView />);
    expect(screen.queryByText(/when you connect a keyboard/i)).toBeNull();
    unmount();
    render(
      <CapabilitiesProvider value={{ diagnostics: { remote: true, record: () => {} } }}>
        <AboutView />
      </CapabilitiesProvider>,
    );
    expect(screen.getByText(/when you connect a keyboard/i)).toHaveTextContent(/no automatic deletion yet/i);
    expect(screen.getByRole('switch', { name: /help improve file support/i })).toBeInTheDocument();
  });
});
