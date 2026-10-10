#!/usr/bin/env python3
"""
npno-decode — decode the audio in a Nord Piano library (`.npno`, CNSP body) to WAV.

Reference implementation of the piano codec recovered from the Stage 4 firmware's piano DSP
(docs/NSP-FORMAT.md, "CNSP audio — decoded"). Stdlib only; slow but exact.

Layout (offsets relative to the `CNSP` tag; all integers big-endian):

  +0x61C   u16 version, u16 channels (1 = mono, 2 = stereo), u16 stroke count
  +0x72C   stroke records, 0x76 bytes each:
             +0x06 u32  offset of the stroke's first block, relative to the CNSP tag
             +0x0C u32  stroke length in sample frames
             +0x10 u16  block count
             +0x12 4 x i16  predictor history, channel 0 (oldest first)
             +0x1A 4 x i16  predictor history, channel 1 (oldest first; zero when mono)
             +0x22 u32  loop start, +0x26 u32 loop length (0 = no loop)
  blocks   fixed size (511 16-bit words mono, 1022 stereo), one stroke's blocks contiguous:
             word 0      header: bits 0-4 residual width w, bits 5-7 predictor order (0-4),
                         bits 8-15 block level in dB below the stroke peak (not applied here)
             words 1..   residuals, w bits each, sign-extended, packed LSB-first into a
                         little-endian sequence of the 16-bit words; stereo interleaves L,R
                         per frame. A block holds floor(bits / (w * channels)) frames, of
                         which the first `that - 64` are its own; the last 64 repeat the
                         next block's opening frames (decoder slack) and are skipped here.
  decode   x[n] = residual + sum(c_k * x[n-k]), c = binomial predictor of the block's
           order ([1], [2,-1], [3,-3,1], [4,-6,4,-1]); history carries across blocks and
           starts from the record's values.

The audio is Nord's: write output to a local, gitignored folder (docs/LEGAL.md).

Usage:
  python3 scripts/npno-decode.py <file.npno> <out_dir> [--rate 44100]
"""
import struct
import sys
import wave
from pathlib import Path

COEF = {0: (), 1: (1,), 2: (2, -1), 3: (3, -3, 1), 4: (4, -6, 4, -1)}  # newest sample first
RECORD_SIZE = 0x76


def strokes(d: bytes):
    cnsp = d.find(b'CNSP')
    if cnsp < 0:
        raise ValueError('no CNSP body')
    version, nch, count = struct.unpack_from('>3H', d, cnsp + 0x61C)
    recs = []
    for i in range(count):
        p = cnsp + 0x72C + i * RECORD_SIZE
        off, = struct.unpack_from('>I', d, p + 6)
        length, nblocks = struct.unpack_from('>IH', d, p + 12)
        hist = (struct.unpack_from('>4h', d, p + 18), struct.unpack_from('>4h', d, p + 26))
        recs.append({'offset': cnsp + off, 'length': length, 'blocks': nblocks,
                     'history': [list(reversed(h)) for h in hist[:nch]]})
    return version, nch, recs


def decode_stroke(d: bytes, rec: dict, nch: int, block_words: int):
    hist = [list(h) for h in rec['history']]
    out = []
    for b in range(rec['blocks']):
        base = rec['offset'] + b * block_words * 2
        words = struct.unpack_from('>%dH' % block_words, d, base)
        w, order = words[0] & 0x1F, (words[0] >> 5) & 7
        own = (block_words - 1) * 16 // (w * nch) - 64
        coef = COEF[order]
        acc = accn = 0
        it = iter(words[1:])
        for _ in range(own):
            frame = []
            for c in range(nch):
                while accn < w:
                    acc |= next(it) << accn
                    accn += 16
                r = acc & ((1 << w) - 1)
                acc >>= w
                accn -= w
                if r >> (w - 1):
                    r -= 1 << w
                h = hist[c]
                x = r + sum(k * h[j] for j, k in enumerate(coef))
                h.insert(0, x)
                del h[4:]
                frame.append(x)
            out.append(frame)
    if len(out) != rec['length']:
        raise ValueError(f'decoded {len(out)} frames, record says {rec["length"]}')
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        print(__doc__)
        return 2
    rate = int(sys.argv[sys.argv.index('--rate') + 1]) if '--rate' in sys.argv else 44100
    d = Path(args[0]).read_bytes()
    out_dir = Path(args[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    version, nch, recs = strokes(d)
    # block size from the stroke layout: consecutive strokes are contiguous
    span = recs[1]['offset'] - recs[0]['offset'] if len(recs) > 1 else None
    block_words = span // recs[0]['blocks'] // 2 if span else (511 * nch)
    print(f'CNSP version {version:#x}, {nch} channel(s), {len(recs)} strokes, {block_words}-word blocks')
    for i, rec in enumerate(recs):
        frames = decode_stroke(d, rec, nch, block_words)
        peak = max(abs(v) for f in frames for v in f)
        pcm = struct.pack('<%dh' % (len(frames) * nch),
                          *(max(-32768, min(32767, v)) for f in frames for v in f))
        with wave.open(str(out_dir / f'stroke{i:03d}.wav'), 'wb') as wv:
            wv.setnchannels(nch)
            wv.setsampwidth(2)
            wv.setframerate(rate)
            wv.writeframes(pcm)
        print(f'stroke {i:3d}: {len(frames):7d} frames, {rec["blocks"]:4d} blocks, peak {peak}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
