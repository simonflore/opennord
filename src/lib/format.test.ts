import { describe, it, expect } from 'vitest';
import { formatBytes } from './format';

describe('formatBytes', () => {
  it('scales through B / KB / MB / GB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe('3.0 GB'); // GB tier — missing in the old SampleHeader copy
  });
});
