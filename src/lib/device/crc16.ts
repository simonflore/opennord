/**
 * CRC-16/CCITT-FALSE — the Nord USB transport checksum. The implementation
 * lives in the shared container layer (the same CRC also closes the legacy
 * program-file formats as a 2-byte LE trailer); re-exported here for the
 * device/transport modules.
 */
export { crc16ccitt } from '../clavia/crc16';
