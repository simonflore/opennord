import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlanReview } from './PlanReview';
import type { Plan } from '../../lib/device/reorg';

const plan: Plan = { ops: [], journalSlots: [], summary: 'Move "Wurli Soft" from C:81 to D:51' };

describe('PlanReview', () => {
  it('shows the human summary and a default-on backup toggle', () => {
    const html = renderToStaticMarkup(
      <PlanReview plan={plan} backup onBackupChange={() => {}} busy={false} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(html).toContain('Wurli Soft');
    expect(html).toContain('checked'); // backup toggle on by default
  });
});
