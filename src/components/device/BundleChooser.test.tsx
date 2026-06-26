// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, fireEvent } from '@testing-library/react';
import { BundleChooser } from './BundleChooser';

const bundles = [
  { path: 'Backups/TBM 2026-06-13.ns4b', size: 3.16e9 },
  { path: 'Old/Mar.ns4b', size: 1.2e9 },
];

describe('BundleChooser', () => {
  it('defaults to the "Organize which backup?" heading', () => {
    const html = renderToStaticMarkup(<BundleChooser bundles={bundles} onPick={() => {}} />);
    expect(html).toMatch(/organize which backup/i);
  });

  it('renders a custom title and lists each bundle by basename + size', () => {
    const html = renderToStaticMarkup(
      <BundleChooser title="Backups in TBM" bundles={bundles} onPick={() => {}} />);
    expect(html).toMatch(/backups in tbm/i);
    expect(html).toContain('TBM 2026-06-13.ns4b'); // basename shown
    expect(html).toContain('3.16 GB');
    expect(html).not.toContain('Backups/'); // folder prefix stripped
  });

  it('calls onPick with the full bundle path when a row is clicked', () => {
    const onPick = vi.fn();
    const { getByText } = render(<BundleChooser bundles={bundles} onPick={onPick} />);
    fireEvent.click(getByText(/TBM 2026-06-13\.ns4b/));
    expect(onPick).toHaveBeenCalledWith('Backups/TBM 2026-06-13.ns4b');
  });
});
