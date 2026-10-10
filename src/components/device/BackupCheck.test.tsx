// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { buildCbinHeader } from '../../lib/clavia/cbin';
import { patchNs4Checksum } from '../../lib/clavia/checksum';
import { buildMetaXml } from '../../lib/device/ns4b';
import { makeNpno, tone } from '../../lib/ns4/nsp-synth.testing';
import { BackupCheck } from './BackupCheck';

afterEach(cleanup);

function program(): Uint8Array {
  const f = new Uint8Array(868);
  f.set(buildCbinHeader({ formatType: 1, tag: 'ns4p', bank: 0, location: 0, category: 6, versionRaw: 313 }), 0);
  return patchNs4Checksum(f);
}

function backup(files: Record<string, Uint8Array>): Blob {
  return new Blob([zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), ...files }, { level: 0 }) as unknown as BlobPart]);
}

const piano = () => makeNpno([{ pcm: [tone(3000, 0.02, 3000, 1)], velocityFrom: 0, before: [[0, 0, 0, 0]] }], 1, 0x2c);

describe('BackupCheck', () => {
  it('explains itself before it runs', () => {
    render(<BackupCheck file={backup({})} />);
    expect(screen.getByRole('button', { name: 'Check backup' })).toBeInTheDocument();
    expect(screen.getByText(/plays through each piano/)).toBeInTheDocument();
  });

  it('reports an intact backup in plain words', async () => {
    render(<BackupCheck file={backup({ 'Program/Bank A/Lead.ns4p': program(), 'Piano/Grand.npno': piano() })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check backup' }));
    expect(await screen.findByText('Everything in this backup checks out.')).toBeInTheDocument();
    expect(screen.getByText('1 program · 1 piano')).toBeInTheDocument();
    expect(screen.getByText('Every note of the piano plays back (1 recorded note).')).toBeInTheDocument();
  });

  it('names the files that need attention', async () => {
    const bad = program();
    bad[500] ^= 1; // the program no longer matches its own check value
    render(<BackupCheck file={backup({ 'Program/Bank A/Broken Lead.ns4p': bad })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check backup' }));
    expect(await screen.findByText('1 of 1 files needs attention.')).toBeInTheDocument();
    expect(screen.getByText('Broken Lead')).toBeInTheDocument();
    expect(screen.getByText(/may refuse to load this program/)).toBeInTheDocument();
  });
});
