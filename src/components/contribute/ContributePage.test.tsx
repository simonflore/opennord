// @vitest-environment jsdom
// src/components/contribute/ContributePage.test.tsx
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { ContributePage } from './ContributePage';

afterEach(cleanup);

describe('ContributePage', () => {
  it('shows the two asks, with a connect step when no Nord is connected', () => {
    render(<DeviceProvider><ContributePage /></DeviceProvider>);
    expect(screen.getByRole('heading', { level: 1, name: /help confirm opennord/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /check your nord/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /help improve file support/i })).toBeInTheDocument();
    // Programs and the rest go by mail (or to the community where there is one), not as asks (#173).
    expect(screen.queryByRole('heading', { name: /share two or three of your programs/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /measure a few sounds/i })).toBeNull();
    expect(screen.getByRole('link', { name: 'opennord@gigmeister.app' })).toHaveAttribute('href', 'mailto:opennord@gigmeister.app');
    // No WebUSB here: the connect step explains it in-line, not as a nested card with its own heading.
    expect(screen.getByText(/open this in chrome or edge to connect/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /open this in chrome/i })).toBeNull();
  });

  it('offers the file-support opt-in, off by default', () => {
    render(<DeviceProvider><ContributePage /></DeviceProvider>);
    expect(screen.getByRole('heading', { name: /help improve file support/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /help improve file support/i })).not.toBeChecked();
  });
});
