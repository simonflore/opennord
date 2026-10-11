import { useEffect } from 'react';
import { useCapabilities } from '../capabilities/CapabilitiesContext';
import { reportFileRead } from './file-read';

/**
 * Report an opened program file (opt-in, once per file per session — see
 * file-read.ts). Runs after render so opening a program never waits on it.
 */
export function useFileReadReport(bytes: Uint8Array | undefined): void {
  const { diagnostics } = useCapabilities();
  useEffect(() => {
    reportFileRead(diagnostics, bytes);
  }, [diagnostics, bytes]);
}
