// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

afterEach(cleanup);

describe('NumberField', () => {
  it('keeps what is typed as a draft and commits it on blur', () => {
    const onCommit = vi.fn();
    render(<NumberField aria-label="Root" value={60} onCommit={onCommit} />);
    const input = screen.getByLabelText('Root');
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.change(input, { target: { value: '62' } });
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue(62);
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(62);
  });

  it('commits on Enter and reverts on Escape', () => {
    const onCommit = vi.fn();
    render(<NumberField aria-label="Tune" value={0} onCommit={onCommit} />);
    const input = screen.getByLabelText('Tune');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue(0);
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('shows the value again when the commit is refused', () => {
    render(<NumberField aria-label="Root" value={60} onCommit={() => undefined} />);
    const input = screen.getByLabelText('Root');
    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(60);
  });

  it('never commits an empty field as 0: it reverts, or clears when it can', () => {
    const onCommit = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(<NumberField aria-label="Level" value={3} onCommit={onCommit} />);
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Level'));
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Level')).toHaveValue(3);
    rerender(<NumberField aria-label="Level" value={3} onCommit={onCommit} onClear={onClear} />);
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Level'));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });
});
