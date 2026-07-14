// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BundlePicker } from './BundlePicker';

afterEach(cleanup);

const bundles = [{ path: 'Gig Backup.ns4b', size: 1_200_000 }, { path: 'Home.ns4b', size: 800_000 }];

describe('BundlePicker', () => {
  it('lists each backup by name (no protocol path) with all checked by default', () => {
    render(<BundlePicker open bundles={bundles} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Gig Backup')).toBeInTheDocument(); // .ns4b stripped
    expect(screen.getByText('Home')).toBeInTheDocument();
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).toBeChecked();
  });

  it('confirms only the still-checked backups by path', () => {
    const onConfirm = vi.fn();
    render(<BundlePicker open bundles={bundles} onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getAllByRole('checkbox')[1]); // uncheck Home
    fireEvent.click(screen.getByRole('button', { name: /load selected/i }));
    expect(onConfirm).toHaveBeenCalledWith(['Gig Backup.ns4b']);
  });

  it('Skip backups confirms an empty selection', () => {
    const onConfirm = vi.fn();
    render(<BundlePicker open bundles={bundles} onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onConfirm).toHaveBeenCalledWith([]);
  });
});
