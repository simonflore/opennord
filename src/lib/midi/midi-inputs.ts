/** Attach to every MIDI input (any controller) and stream raw messages, re-binding
 *  on hot-plug. Desktop Chromium/Firefox only — throws Error('unsupported') where
 *  Web MIDI is absent, Error('denied') if the permission prompt is rejected.
 *  Mirrors the acquisition in ./web-midi.ts (which stays for the Nord CC path). */
export interface MidiInputsHandle {
  deviceNames: string[];
  stop(): void;
}

export async function listenToAllMidiInputs(
  onMessage: (data: Uint8Array) => void,
  onDevicesChanged?: (names: string[]) => void,
): Promise<MidiInputsHandle> {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
    throw new Error('unsupported');
  }
  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch {
    throw new Error('denied');
  }

  const handler = (ev: MIDIMessageEvent) => { if (ev.data) onMessage(ev.data); };
  const bound = new Set<MIDIInput>();
  const names = (): string[] => [...access.inputs.values()].map((i) => i.name ?? 'MIDI input');

  function bindAll() {
    for (const input of access.inputs.values()) {
      if (!bound.has(input)) { input.addEventListener('midimessage', handler); bound.add(input); }
    }
    onDevicesChanged?.(names());
  }
  bindAll();
  access.onstatechange = () => bindAll();

  return {
    deviceNames: names(),
    stop() {
      for (const input of bound) input.removeEventListener('midimessage', handler);
      bound.clear();
      access.onstatechange = null;
    },
  };
}
