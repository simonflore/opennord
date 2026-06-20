// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SplitView } from './SplitView';

describe('SplitView', () => {
  it('renders both panes', () => {
    render(<SplitView master={<div>MASTER</div>} detail={<div>DETAIL</div>} />);
    expect(screen.getByText('MASTER')).toBeInTheDocument();
    expect(screen.getByText('DETAIL')).toBeInTheDocument();
  });
});
