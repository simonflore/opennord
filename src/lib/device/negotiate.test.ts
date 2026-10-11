import { describe, it, expect } from 'vitest';
import {
  parseVersionReply, PROTOCOL_NEGOTIATE, MSG_QRY_VERSIONS, shouldNegotiateVersion, NS4_PRODUCT_ID,
  initialFileTransferVersion,
} from './negotiate';
import { PROTOCOL_ID, PROTOCOL_VERSION } from './opcodes';
import { ALL_MODELS, MODELS } from '../clavia/partitions';

describe('parseVersionReply', () => {
  it('parses the captured NS2 version-negotiation reply (issue #31)', () => {
    // Raw 0x03 reply payload captured from a Nord Stage 2 (fw 3.00):
    //   [count=5] (0x06,1) (0x07,0) (0x0a,2) (0x0c,8) (0x0d,0)
    const payload = new Uint8Array([0x05, 0x06, 0x01, 0x07, 0x00, 0x0a, 0x02, 0x0c, 0x08, 0x0d, 0x00]);
    const versions = parseVersionReply(payload);
    expect(versions.get(PROTOCOL_ID)).toBe(0x08); // FileTransfer (0x0c) at version 8 on NS2
    expect(versions.get(0x0a)).toBe(0x02);
    expect(versions.get(PROTOCOL_NEGOTIATE)).toBe(0x00);
    expect(versions.size).toBe(5);
  });

  it('ignores pairs beyond the advertised count', () => {
    const payload = new Uint8Array([0x01, 0x0c, 0x0a, 0xff, 0xff]); // count=1; trailing junk ignored
    const versions = parseVersionReply(payload);
    expect(versions.size).toBe(1);
    expect(versions.get(PROTOCOL_ID)).toBe(0x0a);
  });

  it('returns an empty map for an empty payload', () => {
    expect(parseVersionReply(new Uint8Array(0)).size).toBe(0);
  });

  it('exposes the handshake opcode constants', () => {
    expect(PROTOCOL_NEGOTIATE).toBe(0x07);
    expect(MSG_QRY_VERSIONS).toBe(0x02);
  });
});

describe('shouldNegotiateVersion', () => {
  it('skips the handshake for the Stage 4 — its FileTransfer version is the 0x0a default', () => {
    // The 0x07 query has no bounded read; if a device never answers it the connect
    // would pend forever. NS4 (the validated transfer path) needs no negotiation, so
    // we never issue the query for it — no dangling read, no risk to enumerate.
    expect(shouldNegotiateVersion(NS4_PRODUCT_ID)).toBe(false);
  });

  it('negotiates for other models so they can adopt a non-default version (NS2 = 0x08)', () => {
    expect(shouldNegotiateVersion(0x0030)).toBe(true); // a non-NS4 Clavia product id
    expect(NS4_PRODUCT_ID).toBe(0x002e);
  });

  it('negotiates for every registry model whose firmware speaks a version below 10', () => {
    for (const m of ALL_MODELS) {
      const pid = m.productId ?? m.staticProductId;
      if (pid === undefined || m.fileTransferVersion === undefined || m.fileTransferVersion >= 10) continue;
      expect(shouldNegotiateVersion(pid), m.id).toBe(true);
    }
  });
});

describe('initialFileTransferVersion', () => {
  it('starts from the model\'s firmware FileTransfer version', () => {
    expect(initialFileTransferVersion(MODELS['stage-4'])).toBe(0x0a);
    expect(initialFileTransferVersion(MODELS['stage-2'])).toBe(8);
    expect(initialFileTransferVersion(MODELS['lead-4'])).toBe(8);
    expect(initialFileTransferVersion(MODELS['electro-4'])).toBe(7);
    expect(initialFileTransferVersion(MODELS['piano-2'])).toBe(6);
    expect(initialFileTransferVersion(MODELS['electro-3'])).toBe(4);
    expect(initialFileTransferVersion(MODELS['wave'])).toBe(4);
  });

  it('falls back to the Stage 4 default when the model or its version is unknown', () => {
    expect(initialFileTransferVersion(undefined)).toBe(PROTOCOL_VERSION);
    expect(initialFileTransferVersion(MODELS['stage-classic'])).toBe(PROTOCOL_VERSION); // no version on record
  });
});
