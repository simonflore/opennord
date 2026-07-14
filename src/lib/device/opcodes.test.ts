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

import { CReqFileCreate, CReqFileWrite, CReqFileDelete } from './opcodes';

describe('write/delete opcodes (Slice 2)', () => {
  it('has the validated values', () => {
    expect(CReqFileCreate).toBe(0x0a);
    expect(CReqFileWrite).toBe(0x10);
    expect(CReqFileDelete).toBe(0x14);
  });
  it('their replies are request | 1', () => {
    expect(CReqFileCreate | 1).toBe(0x0b);
    expect(CReqFileWrite | 1).toBe(0x11);
    expect(CReqFileDelete | 1).toBe(0x15);
  });
});

import { PARTITION_SAMP_LIB, PARTITION_SAMP_LIB_NATIVE, CQryFileGetDependency } from './opcodes';

describe('Samp Lib partition + dependency opcode', () => {
  it('exposes the documented partition indices and the dependency query opcode', () => {
    expect(PARTITION_SAMP_LIB).toBe(5);
    expect(PARTITION_SAMP_LIB_NATIVE).toBe(4);
    expect(CQryFileGetDependency).toBe(0x28);
  });
});
