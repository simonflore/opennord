// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { UnisonPanel } from './UnisonPanel';

afterEach(cleanup);

describe('UnisonPanel', () => {
  it('marks the current setting and reports a new one', () => {
    const onChange = vi.fn();
    render(<UnisonPanel level={2} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Unison 2' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Unison off' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Unison 3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
