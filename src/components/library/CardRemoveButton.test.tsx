// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardRemoveButton } from './CardRemoveButton';

afterEach(cleanup);

describe('CardRemoveButton', () => {
  it('asks before removing, and keeps its clicks from opening the row', async () => {
    const onRemove = vi.fn();
    const onRowClick = vi.fn();
    render(<div data-testid="row" role="button" tabIndex={0} onClick={onRowClick}><CardRemoveButton name="Grand" onRemove={onRemove} /></div>);

    const trigger = screen.getByRole('button', { name: 'Remove Grand from library' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(onRemove).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Remove “Grand” from your library?');
    // Out of the row: a row with content-visibility would clip a fixed child to itself.
    expect(screen.getByTestId('row')).not.toContainElement(dialog);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
    // Focus goes back to the ✕, not to the top of the page.
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Remove Grand from library' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove from library' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
