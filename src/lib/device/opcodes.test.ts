import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_ID, PROTOCOL_VERSION, PARTITION_PROGRAM,
  CReqBegin, CReqEnd, CReqFileOpen, CReqFileClose, CReqFileRead,
  CQryFileInfo, CQryFileIterate,
  ext2Type, type2Ext,
} from './opcodes';

describe('opcodes + constants', () => {
  it('has the validated protocol constants', () => {
    expect(PROTOCOL_ID).toBe(0x0c);
    expect(PROTOCOL_VERSION).toBe(0x0a);
    expect(PARTITION_PROGRAM).toBe(6);
    expect(CReqBegin).toBe(0x04);
    expect(CReqEnd).toBe(0x06);
    expect(CReqFileOpen).toBe(0x0c);
    expect(CReqFileClose).toBe(0x0e);
    expect(CReqFileRead).toBe(0x12);
    expect(CQryFileInfo).toBe(0x1e);
    expect(CQryFileIterate).toBe(0x20);
  });

  it('all request opcodes are even, so reply = request | 1 is distinct', () => {
    // The protocol convention: a reply opcode is always request | 1.
    for (const op of [CReqBegin, CReqEnd, CReqFileOpen, CReqFileClose, CReqFileRead, CQryFileInfo, CQryFileIterate]) {
      expect(op & 1).toBe(0);
      expect((op | 1)).toBe(op + 1);
    }
    expect(CReqBegin | 1).toBe(0x05);
    expect(CQryFileInfo | 1).toBe(0x1f);
  });
});

describe('fourcc helpers', () => {
  it('packs/unpacks an extension big-endian', () => {
    expect(ext2Type('ns4p')).toBe(0x6e733470);
    expect(type2Ext(0x6e733470)).toBe('ns4p');
  });
});
