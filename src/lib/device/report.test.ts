import { describe, it, expect } from 'vitest';
import { probeReportMarkdown, probeIssueUrl } from './report';
import type { ProbeReport } from './probe';

const r: ProbeReport = {
  deviceName: 'Nord Stage 3', productId: 0x0030,
  partitions: [{ index: 6, fileCount: 89 }, { index: 5, fileCount: 12 }],
  capturedAt: '2026-06-20T00:00:00.000Z',
};

describe('report', () => {
  it('renders a markdown report naming device, PID, and partition counts', () => {
    const md = probeReportMarkdown(r);
    expect(md).toContain('Nord Stage 3');
    expect(md).toContain('0x0030');
    expect(md).toContain('| 6 | 89 |');
  });
  it('builds a pre-filled hardware-validation issue url', () => {
    const url = probeIssueUrl(r);
    expect(url.startsWith('https://github.com/simonflore/opennord/issues/new?')).toBe(true);
    expect(url).toContain('labels=hardware-validation');
    expect(url).toContain(encodeURIComponent('Nord Stage 3'));
  });
});
