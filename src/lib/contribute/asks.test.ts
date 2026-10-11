import { describe, it, expect } from 'vitest';
import { measureIssueUrl, programsIssueUrl } from './asks';

const parse = (url: string) => new URL(url).searchParams;

describe('contribute asks', () => {
  it('opens a programs issue that asks only for programs the owner made', () => {
    const q = parse(programsIssueUrl('Nord Stage 3'));
    expect(q.get('labels')).toBe('programs');
    expect(q.get('title')).toBe('Programs from my Nord Stage 3');
    expect(q.get('body')).toMatch(/programs you made yourself/);
    expect(q.get('body')).toMatch(/no factory programs/);
    expect(q.get('body')).toMatch(/- Model: Nord Stage 3/);
  });

  it('keeps recordings on the owner’s computer in the measure issue', () => {
    const q = parse(measureIssueUrl());
    expect(q.get('labels')).toBe('measurements');
    expect(q.get('title')).toBe('I can measure sounds on my Nord');
    expect(q.get('body')).toMatch(/recordings stay on your computer/i);
  });
});
