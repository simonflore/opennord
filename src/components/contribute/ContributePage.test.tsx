// @vitest-environment jsdom
// src/components/contribute/ContributePage.test.tsx
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { ContributePage } from './ContributePage';

describe('ContributePage', () => {
  it('shows the three asks, with a connect step when no Nord is connected', () => {
    render(<DeviceProvider><ContributePage /></DeviceProvider>);
    expect(screen.getByRole('heading', { level: 1, name: /help confirm opennord/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /check your nord/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /share two or three of your programs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /measure a few sounds/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /share programs/i })).toHaveAttribute('href', expect.stringContaining('labels=programs'));
  });
});
