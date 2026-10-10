# ###
# IP: GHIDRA
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##
"""ADSP-214xx SHARC opcode tables used by gen_sinc.py.

Transcribed from the ADI "SHARC Processor Programming Reference" (ADSP-2136x/2137x/214xx,
rev 2.2): Table 10-2 (universal registers), ch. 10 (condition and termination codes) and
ch. 12 "Computation Type Opcodes" (ALU, multiplier, shifter, multifunction and the VISA
short compute).  The display text uses ADI assembler syntax; {n} {x} {y} {m} {a} {xm} {ym}
{xa} {ya} are register-number placeholders filled in by the generator.
"""

_MISC6 = ["FADDR", "DADDR", "UREG_62", "PC", "PCSTK", "PCSTKP", "LADDR", "CURLCNTR",
          "LCNTR", "EMUCLK", "EMUCLK2", "PX", "PX1", "PX2", "TPERIOD", "TCOUNT"]
_SREG7 = ["USTAT1", "USTAT2", "MODE1", "MMASK", "MODE2", "FLAGS", "ASTATX", "ASTATY",
          "STKYX", "STKYY", "IRPTL", "IMASK", "IMASKP", "LRPTL", "USTAT3", "USTAT4"]
UREG = ([f"R{i}" for i in range(16)] + [f"I{i}" for i in range(16)] + [f"M{i}" for i in range(16)]
        + [f"L{i}" for i in range(16)] + [f"B{i}" for i in range(16)] + [f"S{i}" for i in range(16)]
        + _MISC6 + _SREG7)
assert len(UREG) == 128

COND = ["EQ", "LT", "LE", "AC", "AV", "MV", "MS", "SV", "SZ", "FLAG0_IN", "FLAG1_IN", "FLAG2_IN",
        "FLAG3_IN", "TF", "BM", "NOT LCE", "NE", "GE", "GT", "NOT AC", "NOT AV", "NOT MV", "NOT MS",
        "NOT SV", "NOT SZ", "NOT FLAG0_IN", "NOT FLAG1_IN", "NOT FLAG2_IN", "NOT FLAG3_IN", "NOT TF",
        "NOT BM", "TRUE"]
TERM = COND[:15] + ["LCE"] + COND[16:31] + ["FOREVER"]
BOP = {0: "SET", 1: "CLR", 2: "TGL", 4: "TST", 5: "XOR"}
MRREG = {0: "MR0F", 1: "MR1F", 2: "MR2F", 4: "MR0B", 5: "MR1B", 6: "MR2B"}


# ---------------------------------------------------------------- compute field (PGR ch. 12)
ALU = {0x01: "R{n} = R{x} + R{y}", 0x02: "R{n} = R{x} - R{y}", 0x05: "R{n} = R{x} + R{y} + CI",
            0x06: "R{n} = R{x} - R{y} + CI - 1", 0x09: "R{n} = (R{x} + R{y})/2",
            0x0A: "COMP(R{x}, R{y})", 0x0B: "COMPU(R{x}, R{y})", 0x25: "R{n} = R{x} + CI",
            0x26: "R{n} = R{x} + CI - 1", 0x29: "R{n} = R{x} + 1", 0x2A: "R{n} = R{x} - 1",
            0x22: "R{n} = -R{x}", 0x30: "R{n} = ABS R{x}", 0x21: "R{n} = PASS R{x}",
            0x40: "R{n} = R{x} AND R{y}", 0x41: "R{n} = R{x} OR R{y}", 0x42: "R{n} = R{x} XOR R{y}",
            0x43: "R{n} = NOT R{x}", 0x61: "R{n} = MIN(R{x}, R{y})", 0x62: "R{n} = MAX(R{x}, R{y})",
            0x63: "R{n} = CLIP R{x} BY R{y}",
            0x81: "F{n} = F{x} + F{y}", 0x82: "F{n} = F{x} - F{y}", 0x91: "F{n} = ABS (F{x} + F{y})",
            0x92: "F{n} = ABS (F{x} - F{y})", 0x89: "F{n} = (F{x} + F{y})/2", 0x8A: "COMP(F{x}, F{y})",
            0xA2: "F{n} = -F{x}", 0xB0: "F{n} = ABS F{x}", 0xA1: "F{n} = PASS F{x}",
            0xA5: "F{n} = RND F{x}", 0xBD: "F{n} = SCALB F{x} BY R{y}", 0xAD: "R{n} = MANT F{x}",
            0xC1: "R{n} = LOGB F{x}", 0xD9: "R{n} = FIX F{x} BY R{y}", 0xC9: "R{n} = FIX F{x}",
            0xDD: "R{n} = TRUNC F{x} BY R{y}", 0xCD: "R{n} = TRUNC F{x}",
            0xDA: "F{n} = FLOAT R{x} BY R{y}", 0xCA: "F{n} = FLOAT R{x}", 0xC4: "F{n} = RECIPS F{x}",
            0xC5: "F{n} = RSQRTS F{x}", 0xE0: "F{n} = F{x} COPYSIGN F{y}",
            0xE1: "F{n} = MIN(F{x}, F{y})", 0xE2: "F{n} = MAX(F{x}, F{y})",
            0xE3: "F{n} = CLIP F{x} BY F{y}"}

# shifter: key = 8-bit opcode; Type 6 immediate uses opcode>>2 (6 bits)
SHIFT = {0x00: "R{n} = LSHIFT R{x} BY {y}", 0x20: "R{n} = R{n} OR LSHIFT R{x} BY {y}",
          0x04: "R{n} = ASHIFT R{x} BY {y}", 0x24: "R{n} = R{n} OR ASHIFT R{x} BY {y}",
          0x08: "R{n} = ROT R{x} BY {y}", 0xC4: "R{n} = BCLR R{x} BY {y}", 0xC0: "R{n} = BSET R{x} BY {y}",
          0xC8: "R{n} = BTGL R{x} BY {y}", 0xCC: "BTST R{x} BY {y}", 0x44: "R{n} = FDEP R{x} BY {f}",
          0x4C: "R{n} = FDEP R{x} BY {f} (SE)", 0x64: "R{n} = R{n} OR FDEP R{x} BY {f}",
          0x6C: "R{n} = R{n} OR FDEP R{x} BY {f} (SE)", 0x40: "R{n} = FEXT R{x} BY {f}",
          0x48: "R{n} = FEXT R{x} BY {f} (SE)", 0x80: "R{n} = EXP R{x}", 0x84: "R{n} = EXP R{x} (EX)",
          0x88: "R{n} = LEFTZ R{x}", 0x8C: "R{n} = LEFTO R{x}", 0x90: "R{n} = FPACK F{x}",
          0x94: "F{n} = FUNPACK R{x}", 0x74: "BITDEP R{x} BY {b}", 0x50: "R{n} = BITEXT R{x} BY {b}",
          0x58: "R{n} = BITEXT R{x} BY {b} (NU)", 0x7C: "BFFWRP = {w}", 0x70: "R{n} = BFFWRP"}

MOD1 = {(1, 1, 0, 0): "SSI", (0, 1, 0, 0): "SUI", (1, 0, 0, 0): "USI", (0, 0, 0, 0): "UUI",
         (1, 1, 1, 0): "SSF", (0, 1, 1, 0): "SUF", (1, 0, 1, 0): "USF", (0, 0, 1, 0): "UUF",
         (1, 1, 1, 1): "SSFR", (0, 1, 1, 1): "SUFR", (1, 0, 1, 1): "USFR", (0, 0, 1, 1): "UUFR"}

MULALU = {0x04: "R{m} = R{xm} * R{ym} (SSFR), R{a} = R{xa} + R{ya}",
           0x05: "R{m} = R{xm} * R{ym} (SSFR), R{a} = R{xa} - R{ya}",
           0x06: "R{m} = R{xm} * R{ym} (SSFR), R{a} = (R{xa} + R{ya})/2",
           0x08: "MRF = MRF + R{xm} * R{ym} (SSF), R{a} = R{xa} + R{ya}",
           0x09: "MRF = MRF + R{xm} * R{ym} (SSF), R{a} = R{xa} - R{ya}",
           0x0A: "MRF = MRF + R{xm} * R{ym} (SSF), R{a} = (R{xa} + R{ya})/2",
           0x0C: "R{m} = MRF + R{xm} * R{ym} (SSFR), R{a} = R{xa} + R{ya}",
           0x0D: "R{m} = MRF + R{xm} * R{ym} (SSFR), R{a} = R{xa} - R{ya}",
           0x0E: "R{m} = MRF + R{xm} * R{ym} (SSFR), R{a} = (R{xa} + R{ya})/2",
           0x10: "MRF = MRF - R{xm} * R{ym} (SSF), R{a} = R{xa} + R{ya}",
           0x11: "MRF = MRF - R{xm} * R{ym} (SSF), R{a} = R{xa} - R{ya}",
           0x12: "MRF = MRF - R{xm} * R{ym} (SSF), R{a} = (R{xa} + R{ya})/2",
           0x14: "R{m} = MRF - R{xm} * R{ym} (SSFR), R{a} = R{xa} + R{ya}",
           0x15: "R{m} = MRF - R{xm} * R{ym} (SSFR), R{a} = R{xa} - R{ya}",
           0x16: "R{m} = MRF - R{xm} * R{ym} (SSFR), R{a} = (R{xa} + R{ya})/2",
           0x18: "F{m} = F{xm} * F{ym}, F{a} = F{xa} + F{ya}",
           0x19: "F{m} = F{xm} * F{ym}, F{a} = F{xa} - F{ya}",
           0x1A: "F{m} = F{xm} * F{ym}, F{a} = FLOAT R{xa} BY R{ya}",
           0x1B: "F{m} = F{xm} * F{ym}, R{a} = FIX F{xa} BY R{ya}",
           0x1C: "F{m} = F{xm} * F{ym}, F{a} = (F{xa} + F{ya})/2",
           0x1D: "F{m} = F{xm} * F{ym}, F{a} = ABS F{xa}",
           0x1E: "F{m} = F{xm} * F{ym}, F{a} = MAX(F{xa}, F{ya})",
           0x1F: "F{m} = F{xm} * F{ym}, F{a} = MIN(F{xa}, F{ya})"}

SHORT = ["R{n} = R{n} + R{x}", "R{n} = R{n} - R{x}", "R{n} = PASS R{x}", "COMP(R{n}, R{x})",
          "R{n} = NOT R{x}", "R{n} = R{x} + 1", "R{n} = R{x} - 1", "R{n} = R{n} * R{x} (SSI)",
          "F{n} = F{n} + F{x}", "F{n} = F{n} - F{x}", "F{n} = FLOAT R{x}", "COMP(F{n}, F{x})",
          "R{n} = R{n} AND R{x}", "R{n} = R{n} OR R{x}", "R{n} = R{n} XOR R{x}", "F{n} = F{n} * F{x}"]


def mult_text(op, n, x, y):
    """Display text of multiplier opcode `op`, or None for a reserved encoding."""
    if op == 0x30:
        return f"F{n} = F{x} * F{y}"
    hi = op >> 6
    if hi == 0:
        if (op >> 4) == 0:          # SAT
            dst = (op >> 1) & 3
            src = "MRB" if dst & 1 else "MRF"
            lhs = {0: f"R{n}", 1: f"R{n}", 2: "MRF", 3: "MRB"}[dst]
            if op == 0:
                return None
            return f"{lhs} = SAT {src} ({'S' if op & 1 else 'U'}{'F' if op & 8 else 'I'})"
        if (op >> 4) == 1:
            if op == 0x14:
                return "MRF = 0"
            if op == 0x16:
                return "MRB = 0"
            if op & 0x08:
                dst = (op >> 1) & 3
                src = "MRB" if dst & 1 else "MRF"
                lhs = {0: f"R{n}", 1: f"R{n}", 2: "MRF", 3: "MRB"}[dst]
                return f"{lhs} = RND {src} ({'S' if op & 1 else 'U'}F)"
        if op == 0x30:
            return f"F{n} = F{x} * F{y}"
        return None
    y_s, x_s, f, r = (op >> 5) & 1, (op >> 4) & 1, (op >> 3) & 1, op & 1
    mod = MOD1.get((y_s, x_s, f, r)) or f"{'S' if y_s else 'U'}{'S' if x_s else 'U'}?"
    dst = (op >> 1) & 3
    if hi == 1:
        lhs = {0: f"R{n}", 1: None, 2: "MRF", 3: "MRB"}[dst]
        return f"{lhs} = R{x} * R{y} ({mod})" if lhs else None
    sign = "+" if hi == 2 else "-"
    acc = "MRB" if dst & 1 else "MRF"
    lhs = f"R{n}" if dst < 2 else acc
    return f"{lhs} = {acc} {sign} R{x} * R{y} ({mod})"


