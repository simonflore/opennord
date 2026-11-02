import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeviceProvider } from '../../lib/device/DeviceContext';
import type { PartitionInfo } from '../../lib/device/partition-list';
import { HardwareChecks, PartitionTable } from './HardwareChecks';
import { UntestedWritesNotice } from '../shell/UntestedWritesBanner';

const device = vi.hoisted(() => ({ fake: null as null | Record<string, unknown> }));
const allowed = vi.hoisted(() => ({ kinds: [] as ('sample' | 'piano')[] }));

vi.mock('../../lib/device/DeviceContext', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../lib/device/DeviceContext')>();
  return { ...real, useDevice: () => device.fake ?? real.useDevice() };
});
vi.mock('../../lib/device/write-guard', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../lib/device/write-guard')>();
  return { ...real, untestedWritesAllowed: () => allowed.kinds };
});

const session = { canWrite: (p: number) => p >= 5, programPartition: 6 };

beforeEach(() => { device.fake = null; allowed.kinds = []; });

describe('HardwareChecks', () => {
  it('asks for a connected Nord before any check', () => {
    const html = renderToStaticMarkup(<DeviceProvider><HardwareChecks /></DeviceProvider>);
    expect(html).toContain('Hardware session');
    expect(html).toContain('Connect your Nord');
  });

  it('with a Nord: the partition list, the two-piece write and the untested-write switches', () => {
    device.fake = { session, markLost: () => undefined };
    const html = renderToStaticMarkup(<HardwareChecks />);
    expect(html).toContain('Read the partition list');
    expect(html).toContain('OPENNORD 2PIECE');
    expect(html).toContain('never replaces one');
    expect(html).toContain('Let OpenNord write samples');
    expect(html).toContain('Let OpenNord write pianos');
    // Task 9 carry: both things the switch arms are named next to it.
    expect(html).toMatch(/Send to Nord/);
    expect(html).toMatch(/Restore/);
    expect(html).toMatch(/removes/);
    expect(html).not.toContain('role="alert"');
  });

  it('shows each switch on when its kind is allowed', () => {
    device.fake = { session, markLost: () => undefined };
    allowed.kinds = ['piano'];
    const html = renderToStaticMarkup(<HardwareChecks />);
    const checked = (label: string) => {
      const input = html.slice(0, html.indexOf(label)).split('<input').at(-1) ?? '';
      return /\bchecked\b/.test(input);
    };
    expect(checked('Let OpenNord write samples')).toBe(false);
    expect(checked('Let OpenNord write pianos')).toBe(true);
  });
});

describe('PartitionTable', () => {
  const p = (index: number, over: Partial<PartitionInfo> = {}): PartitionInfo => ({
    index, name: `Part ${index}`, blockBytes: 65536, blockRounding: 65535, writeAlign: 512, word3: 0,
    flags: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], matchByName: true, eraseSupported: true, ...over,
  });

  it('shows canWrite from the session, erase and match-by-name, and labelled hex flags', () => {
    const html = renderToStaticMarkup(
      <PartitionTable list={[p(0, { eraseSupported: false, matchByName: false, flags: [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0] }), p(6)]} canWrite={(i) => i === 6} />,
    );
    expect(html).toContain('canWrite');
    expect(html).toContain('eraseSupported');
    expect(html).toContain('matchByName');
    expect(html).toMatch(/<td>Part 0<\/td>.*?<td>false<\/td><td>false<\/td><td>false<\/td>/);
    expect(html).toMatch(/<td>Part 6<\/td>.*?<td>true<\/td><td>true<\/td><td>true<\/td>/);
    expect(html).toContain('10 erase');
    expect(html).toContain('11 dependencies');
    expect(html).toContain('7 match (0 = by name)');
    expect(html).toContain('0 unresolved (start bank?)');
  });
});

describe('UntestedWritesNotice', () => {
  it('says nothing while no untested write is on', () => {
    expect(renderToStaticMarkup(<UntestedWritesNotice kinds={[]} />)).toBe('');
  });

  it('names the kinds and where to turn them off', () => {
    const html = renderToStaticMarkup(<UntestedWritesNotice kinds={['sample']} />);
    expect(html).toContain('Untested writes are ON');
    expect(html).toContain('samples');
    expect(html).toContain('/dev/hardware');
  });
});
