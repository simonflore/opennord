// @vitest-environment jsdom
// src/components/contribute/ContributePage.test.tsx
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import { ContributePage } from './ContributePage';

describe('ContributePage', () => {
  it('renders the help-decode intro when no device session is present', () => {
    render(<DeviceProvider><ContributePage /></DeviceProvider>);
    expect(screen.getByRole('heading', { name: /help decode your nord/i })).toBeInTheDocument();
  });
});
