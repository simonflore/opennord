// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ProgramView } from './ProgramView';
import { CapabilitiesProvider } from '../../lib/capabilities/CapabilitiesContext';
import type { DiagnosticEvent } from '../../lib/capabilities/types';
import { parseClaviaFile } from '../../lib/formats';
import { synthFwBody, synthFwFile } from '../../lib/clavia/block-chain.synth';
import { NG_LAYOUT } from '../../lib/ng/layout.generated';
import { resetFileReadSession } from '../../lib/diagnostics/file-read';
import { writeFileSupportOptIn } from '../../lib/diagnostics/file-support-pref';

const grand = () => {
  const program = parseClaviaFile(synthFwFile('ngp', synthFwBody(NG_LAYOUT))).program;
  program.name = 'My Secret Ballad';
  return program;
};

function open(events: DiagnosticEvent[]) {
  const diagnostics = { record: (e: DiagnosticEvent) => { events.push(e); } };
  return render(
    <CapabilitiesProvider value={{ diagnostics }}>
      <ProgramView program={grand()} />
    </CapabilitiesProvider>,
  );
}

beforeEach(() => { localStorage.clear(); resetFileReadSession(); });
afterEach(cleanup);

describe('ProgramView — file-support report', () => {
  it('reports nothing when the player has not opted in', () => {
    const events: DiagnosticEvent[] = [];
    open(events);
    expect(events).toHaveLength(0);
  });

  it('reports an opened program once per session when opted in, without its name', () => {
    writeFileSupportOptIn(true);
    const events: DiagnosticEvent[] = [];
    open(events);
    cleanup();
    open(events); // re-opening the same file
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: 'file.read', ok: true });
    expect(JSON.stringify(events)).not.toContain('Secret');
  });
});
