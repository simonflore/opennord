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

  it('renders title + children with dialog semantics when open', () => {
    render(<Dialog open onClose={() => {}} title="Choose backups"><p>body</p></Dialog>);
    const dlg = screen.getByRole('dialog');
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg).toHaveAttribute('aria-label', 'Choose backups');
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="X">body</Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on backdrop click but not on content click', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="X"><button>inside</button></Dialog>);
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('inside'));
    expect(onClose).toHaveBeenCalledOnce(); // unchanged
  });
});
