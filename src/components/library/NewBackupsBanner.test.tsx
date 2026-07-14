// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewBackupsBanner } from './NewBackupsBanner';

afterEach(cleanup);

describe('NewBackupsBanner', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<NewBackupsBanner count={0} onReview={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows the count and calls onReview', () => {
    const onReview = vi.fn();
    render(<NewBackupsBanner count={3} onReview={onReview} />);
    expect(screen.getByText(/3 new backups/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    expect(onReview).toHaveBeenCalledOnce();
  });
});
