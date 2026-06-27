// @vitest-environment jsdom
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { CapabilityGate } from './CapabilityGate';
import { CapabilitiesProvider } from '@/lib/capabilities/CapabilitiesContext';

describe('CapabilityGate', () => {
  it('shows the locked state when the capability is absent', () => {
    render(
      <CapabilityGate needs={(c) => c.cloud.available} title="Cloud backup" blurb="Sync your patches.">
        <div>real cloud ui</div>
      </CapabilityGate>,
    );
    expect(screen.getByText('Cloud backup')).toBeTruthy();
    expect(screen.queryByText('real cloud ui')).toBeNull();
  });

  it('renders children when the capability is present', () => {
    render(
      <CapabilitiesProvider value={{ cloud: { available: true } }}>
        <CapabilityGate needs={(c) => c.cloud.available} title="Cloud backup" blurb="Sync your patches.">
          <div>real cloud ui</div>
        </CapabilityGate>
      </CapabilitiesProvider>,
    );
    expect(screen.getByText('real cloud ui')).toBeTruthy();
    expect(screen.queryByText('Cloud backup')).toBeNull();
  });
});
