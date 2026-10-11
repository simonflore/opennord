// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

afterEach(cleanup);

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Dialog open={false} onClose={() => {}} title="X">body</Dialog>);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title as the dialog accessible name, plus children and a backdrop', () => {
    render(<Dialog open onClose={() => {}} title="Choose backups"><p>body</p></Dialog>);
    // Radix names the dialog from its <Title> (aria-labelledby)
    expect(screen.getByRole('dialog', { name: 'Choose backups' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-backdrop')).toBeInTheDocument();
  });

  it('a bare dialog keeps the title for screen readers only and takes its own layout', () => {
    render(<Dialog open bare onClose={() => {}} title="Go to" className="top-[12vh]"><input aria-label="q" /></Dialog>);
    const dialog = screen.getByRole('dialog', { name: 'Go to' });
    expect(dialog.className).toContain('top-[12vh]');
    expect(dialog.className).not.toContain('p-4');
    expect(screen.getByText('Go to').className).toBe('sr-only');
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="X">body</Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
