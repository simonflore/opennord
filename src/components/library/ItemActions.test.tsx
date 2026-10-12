// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ItemActions } from './ItemActions';

afterEach(cleanup);

describe('ItemActions', () => {
  it('makes Send to Nord the one orange button when it can go', () => {
    const onSend = vi.fn();
    render(<ItemActions send={{ onSend }} save={{ onSave: vi.fn() }} />);
    const send = screen.getByRole('button', { name: 'Send to Nord' });
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalled();
    expect(send.className).not.toEqual(screen.getByRole('button', { name: 'Save to computer' }).className);
  });

  it('greys Send to Nord with the reason beside it, and hands the orange to Save', () => {
    render(<ItemActions send={{ onSend: vi.fn(), disabledReason: 'Connect your Nord to send it.' }} save={{ onSave: vi.fn() }} />);
    const send = screen.getByRole('button', { name: 'Send to Nord' });
    expect(send).toBeDisabled();
    expect(send).toHaveAccessibleDescription('Connect your Nord to send it.');
  });

  it('shows the save progress, and puts the rest under More', () => {
    const onRemove = vi.fn();
    render(<ItemActions save={{ onSave: vi.fn(), busy: true, busyLabel: 'Reading from Nord… 40%' }} more={[{ label: 'Remove from library', onSelect: onRemove }]} />);
    expect(screen.getByRole('button', { name: 'Reading from Nord… 40%' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove from library' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
