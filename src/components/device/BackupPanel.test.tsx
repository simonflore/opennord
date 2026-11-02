import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BackupPanel } from './BackupPanel';
import { NordSession } from '../../lib/device/session';
import { MockTransport } from '../../lib/device/transport';
import { USER_PARTITIONS } from '../../lib/device/ns4b';

function render(writable: number[], stage4Layout = false): string {
  const session = new NordSession(new MockTransport([]));
  session.allowWrites(writable);
  session.stage4Layout = stage4Layout;
  return renderToStaticMarkup(<BackupPanel session={session} deviceName="Nord" onAfterRestore={() => {}} />);
}

describe('BackupPanel', () => {
  it('offers Restore when every partition a backup restores to can be written (a Stage 4)', () => {
    const html = render(USER_PARTITIONS.map((p) => p.partition));
    expect(html).toMatch(/Restore Nord…/);
    expect(html).not.toMatch(/Restoring a backup is off/);
  });

  it('replaces Restore with a short explanation when only programs are confirmed (e.g. iPad)', () => {
    const html = render([6]);
    expect(html).not.toMatch(/Restore Nord…/);
    expect(html).toMatch(/Restoring a backup is off on this keyboard/);
    expect(html).toMatch(/Back up Nord/); // backing up still works
  });

  it('just hides Restore on a browse-only keyboard (the page note already explains)', () => {
    const html = render([]);
    expect(html).not.toMatch(/Restore Nord…/);
    expect(html).not.toMatch(/Restoring a backup is off/);
  });

  it('offers to update an earlier backup only where a backup holds the samples and pianos (a Stage 4)', () => {
    expect(render(USER_PARTITIONS.map((p) => p.partition), true)).toMatch(/Update a backup…/);
    // Another model's backup is its programs only: nothing an update could copy.
    const programsOnly = render([6]);
    expect(programsOnly).not.toMatch(/Update a backup…/);
    expect(programsOnly).not.toMatch(/same name, place and size/);
    expect(programsOnly).toMatch(/Back up Nord/);
  });
});
