#!/usr/bin/env python3
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
"""Generate sharc214xx.sinc, the instruction tables of the ADSP-214xx SHARC (ISA + VISA).

    python3 tools/gen_sinc.py [data/languages/sharc214xx.sinc]

The encodings come from the opcode tables in sharc_isa.py.  The hand-written
sharc214xx.slaspec holds the address spaces, registers, context, macros, the DS, LoopTop
and ISA subtables and the root table; this file writes everything that is derived from the
tables: tokens and attach lists, the condition subtables, the compute subtables, the
branch-target subtables, and the `instr` subtable holding every instruction.

Tokens: i32 = instruction bits 47..16, i16 = bits 15..0, s16 = bits 47..32 (a 16-bit VISA
parcel).  A field "aH_L" is instruction bits H..L inside i32, "bH_L" inside i16 and "sH_L"
inside s16.  VISA 32-bit forms are the 48-bit forms with the compute field truncated and
bits 22..16 = 0x3f (PGR ch. 9 preamble), so both are generated from one description.

The output is deterministic.  DEBUG=1 prints a summary of the generated tables.
"""
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sharc_isa as S                                   # noqa: E402

DEBUG = bool(os.environ.get("DEBUG"))
# Target variant.  "214xx" (default) is the original ADSP-214xx model.  "plus" is the
# SHARC+ core (ADSP-SC58x/2158x, SHARC+ Core Programming Reference rev 1.4): block 0's
# normal-word/48-bit base is 0x90000, so a 48-bit address A is aliased at
# SW = 3*A - (A & 0xf0000); and DO (types 12a/13a) carries a 23-bit PC-relative end address
# with bit 23 selecting an F1-active loop, written "(F)".
VARIANT = os.environ.get("SHARC_VARIANT", "214xx")
PLUS = VARIANT == "plus"
MASK48 = "0xf0000" if PLUS else "0xe0000"
HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE.parent / "data" / "languages" / "sharc214xx.sinc"

UREG = list(S.UREG)
R = [f"R{i}" for i in range(16)]
F = [f"F{i}" for i in range(16)]
COND_NAMES = S.COND
TERM_NAMES = S.TERM


class Fields:
    """Allocate named bit fields on the three tokens, plus attach lists."""

    def __init__(self):
        self.defs = {"i32": {}, "i16": {}, "s16": {}}
        self.attach_vars = {}      # field -> list of register names
        self.attach_names = {}     # field -> list of display names
        self.signed = set()
        self.meta = {}             # name -> (hi, lo, tok, signed)
        self.nalias = 0

    def tok_of(self, name):
        return self.meta[name][2]

    def alias(self, name):
        """A new field over the same bits with the same attach (for repeated display)."""
        hi, lo, tok, sg = self.meta[name]
        self.nalias += 1
        n = self.f(hi, lo, tok=tok, kind=f"_d{self.nalias}", signed=sg)
        if name in self.attach_vars:
            self.attach_vars[n] = self.attach_vars[name]
        if name in self.attach_names:
            self.attach_names[n] = self.attach_names[name]
        return n

    def f(self, hi, lo, tok=None, kind="", signed=False):
        """Field for instruction bits hi..lo; tok forced for s16."""
        if tok is None:
            if lo >= 16:
                tok = "i32"
            elif hi <= 15:
                tok = "i16"
            else:
                raise ValueError(f"field {hi}..{lo} spans tokens")
        pre = {"i32": "a", "i16": "b", "s16": "s"}[tok]
        base = {"i32": 16, "i16": 0, "s16": 32}[tok]
        name = f"{pre}{hi}_{lo}{kind}" + ("s" if signed else "")
        self.defs[tok][name] = (hi - base, lo - base)
        self.meta[name] = (hi, lo, tok, signed)
        if signed:
            self.signed.add(name)
        return name

    def regs(self, hi, lo, regs, tok=None, kind=""):
        n = self.f(hi, lo, tok, kind=kind)
        if n in self.attach_vars and self.attach_vars[n] != regs:
            raise ValueError(f"field {n} attached to two register lists")
        self.attach_vars[n] = regs
        return n

    def names(self, hi, lo, names, tok=None, kind=""):
        n = self.f(hi, lo, tok, kind=kind + "N")
        self.attach_names[n] = names
        return n

    def render(self):
        out = []
        sizes = {"i32": 32, "i16": 16, "s16": 16}
        for tok, fs in self.defs.items():
            out.append(f"define token {tok} ({sizes[tok]})")
            for n, (h, l) in sorted(fs.items()):
                out.append(f"  {n} = ({l},{h}){' signed' if n in self.signed else ''}")
            out.append(";")
        # group attaches by identical lists
        for kind, table in (("variables", self.attach_vars), ("names", self.attach_names)):
            groups = {}
            for n, lst in table.items():
                groups.setdefault(tuple(lst), []).append(n)
            for lst, ns in groups.items():
                items = " ".join(f'"{x}"' if kind == "names" else x for x in lst)
                out.append(f"attach {kind} [ {' '.join(sorted(ns))} ] [ {items} ];")
        return "\n".join(out)


FL = Fields()


def disp(template, fieldmap):
    """Turn 'R{n} = R{x} + R{y}' into a SLEIGH display using fieldmap {('R','n'): field}.
    Returns (display, fields) -- repeated operands get alias fields (SLEIGH forbids repeats)."""
    parts = re.split(r"([RF])\{(\w+)\}", template)
    out, used = [], []
    i = 0
    while i < len(parts):
        lit = parts[i]
        if lit:
            out.append('"' + lit.replace('"', "") + '"')
        if i + 2 < len(parts):
            fld = fieldmap[(parts[i + 1], parts[i + 2])]
            if fld in used:
                fld = FL.alias(fld)
            used.append(fld)
            out.append(fld)
        i += 3
    return ("^".join(out) if out else ""), used


# ------------------------------------------------------------------ compute field layouts
class Layout:
    """Where compute bit k lives: '48' (i32 bits 22..16, i16 bits 15..0) or '2b' (i32 k+16)."""

    def __init__(self, name):
        self.name = name

    def fld(self, hi, lo, regs=None, names=None, kind=""):
        off = 16 if self.name == "2b" else 0
        h, l = hi + off, lo + off
        if regs is not None:
            return FL.regs(h, l, regs, kind=kind)
        if names is not None:
            return FL.names(h, l, names, kind=kind)
        return FL.f(h, l, kind=kind)

    def op8(self, value):
        """constraint text for compute bits 19..12 == value."""
        if self.name == "2b":
            return f"{self.fld(19, 12)}={value:#x}", None
        return f"{self.fld(19, 16)}={value >> 4:#x}", f"{self.fld(15, 12)}={value & 0xF:#x}"

    def pattern(self, i32c, i16c):
        """Join constraints into a pattern (i32 part ; i16 part for '48')."""
        i32c = [c for c in i32c if c]
        i16c = [c for c in i16c if c]
        if self.name == "2b":
            return " & ".join(i32c + i16c)
        left = " & ".join(i32c) if i32c else "epsilon"
        right = " & ".join(i16c) if i16c else "epsilon"
        return f"{left} ; {right}"


def reg_fields(L, tag):
    """Common compute register operands for layout L."""
    fm = {}
    for letter, regs in (("R", R), ("F", F)):
        for key, (h, l) in (("n", (11, 8)), ("x", (7, 4)), ("y", (3, 0)), ("s", (15, 12)),
                            ("m", (15, 12)), ("a", (11, 8)), ("s2", (19, 16))):
            if letter == "R":
                fm[(letter, key)] = L.fld(h, l, regs=R, kind=f"r{key}")
            else:
                fm[(letter, key)] = L.fld(h, l, names=F, kind=f"f{key}")
    # multifunction 2-bit operands
    for key, (h, l), regs in (("xm", (7, 6), R[0:4]), ("ym", (5, 4), R[4:8]),
                              ("xa", (3, 2), R[8:12]), ("ya", (1, 0), R[12:16])):
        fm[("R", key)] = L.fld(h, l, regs=regs, kind=f"r{key}")
        fm[("F", key)] = L.fld(h, l, names=[f"F{int(r[1:])}" for r in regs], kind=f"f{key}")
    return fm


def sem_vars(fm):
    """Map template placeholders to semantic register operand names (always R fields)."""
    return {k: fm[("R", k)] for k in ("n", "x", "y", "s", "m", "a", "s2", "xm", "ym", "xa", "ya")}


# p-code bodies for single-function ops, keyed by (cu, op8). Placeholders {n} {x} {y} {s}.
FIX = "setfix({n});"
FLT = "setflt({n});"
SHZ = "setsz({n});"   # shifter results set SZ
ALU_SEM = {
    0x01: "{n} = {x} + {y}; " + FIX, 0x02: "{n} = {x} - {y}; " + FIX,
    0x05: "{n} = {x} + {y} + zext(AC); " + FIX, 0x06: "{n} = {x} - {y} + zext(AC) - 1; " + FIX,
    0x09: "{n} = ({x} + {y}) s>> 1; " + FIX,
    0x0A: "AZ = ({x} == {y}); AN = ({x} s< {y});", 0x0B: "AZ = ({x} == {y}); AN = ({x} < {y});",
    0x25: "{n} = {x} + zext(AC); " + FIX, 0x26: "{n} = {x} + zext(AC) - 1; " + FIX,
    0x29: "{n} = {x} + 1; " + FIX, 0x2A: "{n} = {x} - 1; " + FIX, 0x22: "{n} = -{x}; " + FIX,
    0x30: "local m:4 = {x} s>> 31; {n} = ({x} ^ m) - m; " + FIX, 0x21: "{n} = {x}; " + FIX,
    0x40: "{n} = {x} & {y}; " + FIX, 0x41: "{n} = {x} | {y}; " + FIX,
    0x42: "{n} = {x} ^ {y}; " + FIX, 0x43: "{n} = ~{x}; " + FIX,
    0x61: "local t:4 = {x}; if ({x} s<= {y}) goto <d>; t = {y}; <d> {n} = t; " + FIX,
    0x62: "local t:4 = {x}; if ({x} s>= {y}) goto <d>; t = {y}; <d> {n} = t; " + FIX,
    0x63: "{n} = clip({x}, {y}); " + FIX,
    0x81: "{n} = {x} f+ {y}; " + FLT, 0x82: "{n} = {x} f- {y}; " + FLT,
    0x91: "{n} = abs({x} f+ {y}); " + FLT, 0x92: "{n} = abs({x} f- {y}); " + FLT,
    0x89: "{n} = ({x} f+ {y}) f* 0x3f000000:4; " + FLT,
    0x8A: "AZ = ({x} f== {y}); AN = ({x} f< {y});",
    0xA2: "{n} = f- {x}; " + FLT, 0xB0: "{n} = abs({x}); " + FLT, 0xA1: "{n} = {x}; " + FLT,
    0xA5: "{n} = {x}; " + FLT, 0xBD: "{n} = scalb({x}, {y}); " + FLT,
    0xAD: "{n} = mant({x}); " + FIX, 0xC1: "{n} = logb({x}); " + FIX,
    0xD9: "local sc:4 = scalb({x}, {y}); {n} = trunc(round(sc)); " + FIX, 0xC9: "{n} = trunc(round({x})); " + FIX,
    0xDD: "local sc:4 = scalb({x}, {y}); {n} = trunc(sc); " + FIX, 0xCD: "{n} = trunc({x}); " + FIX,
    0xDA: "local fl:4 = int2float({x}); {n} = scalb(fl, {y}); " + FLT, 0xCA: "{n} = int2float({x}); " + FLT,
    0xC4: "{n} = recips({x}); " + FLT, 0xC5: "{n} = rsqrts({x}); " + FLT,
    0xE0: "{n} = copysign({x}, {y}); " + FLT,
    0xE1: "local t:4 = {x}; if ({x} f<= {y}) goto <d>; t = {y}; <d> {n} = t; " + FLT,
    0xE2: "local t:4 = {x}; if ({x} f>= {y}) goto <d>; t = {y}; <d> {n} = t; " + FLT,
    0xE3: "{n} = fclip({x}, {y}); " + FLT,
}
SHIFT_SEM = {
    0x00: "local c:4 = {y}; local r:4 = {x} << c; if (c s>= 0) goto <d>; r = {x} >> -c; <d> {n} = r; " + SHZ,
    0x04: "local c:4 = {y}; local r:4 = {x} << c; if (c s>= 0) goto <d>; r = {x} s>> -c; <d> {n} = r; " + SHZ,
    0x20: "local c:4 = {y}; local r:4 = {x} << c; if (c s>= 0) goto <d>; r = {x} >> -c; <d> {n} = {n} | r; " + SHZ,
    0x24: "local c:4 = {y}; local r:4 = {x} << c; if (c s>= 0) goto <d>; r = {x} s>> -c; <d> {n} = {n} | r; " + SHZ,
    0x08: "{n} = rot({x}, {y}); " + SHZ,
    0xC4: "{n} = {x} & ~(1 << {y}); " + SHZ, 0xC0: "{n} = {x} | (1 << {y}); " + SHZ,
    0xC8: "{n} = {x} ^ (1 << {y}); " + SHZ, 0xCC: "SZ = (({x} >> {y}) & 1) == 0;",
}


# Immediate LSHIFT/ASHIFT ([OR]): (sem for count >= 0, sem for count < 0); {k} is the
# signed 8-bit count field.
IMM_SHIFT_SEM = {
    0x00: ("{n} = {x} << {k}; " + SHZ, "{n} = {x} >> -{k}; " + SHZ),
    0x04: ("{n} = {x} << {k}; " + SHZ, "{n} = {x} s>> -{k}; " + SHZ),
    0x20: ("{n} = {n} | ({x} << {k}); " + SHZ, "{n} = {n} | ({x} >> -{k}); " + SHZ),
    0x24: ("{n} = {n} | ({x} << {k}); " + SHZ, "{n} = {n} | ({x} s>> -{k}); " + SHZ),
}
# Bit-field extract/deposit with an immediate bit6:len6 (PGR ch. 11 "Shifter/Shift Immediate Computations");
# {b} = bit6, {l} = len6.  Computed in 64 bits so that len6 = 32 needs no special case.
FIELD_SEM = {
    0x40: "local fv:8 = (zext({x}) >> {b}) & ((1 << {l}) - 1); {n} = fv:4;",
    0x48: "local fv:8 = (zext({x}) >> {b}) & ((1 << {l}) - 1); local fs:8 = (fv << (64 - {l})) s>> (64 - {l}); {n} = fs:4;",
    0x44: "local fv:8 = (zext({x}) & ((1 << {l}) - 1)) << {b}; {n} = fv:4;",
    0x4C: "local fs:8 = (sext({x}) << (64 - {l})) s>> (64 - {l}); local fv:8 = fs << {b}; {n} = fv:4;",
    0x64: "local fv:8 = (zext({x}) & ((1 << {l}) - 1)) << {b}; {n} = {n} | fv:4;",
    0x6C: "local fs:8 = (sext({x}) << (64 - {l})) s>> (64 - {l}); local fv:8 = fs << {b}; {n} = {n} | fv:4;",
}


def mult_sem(op, v):
    """p-code for multiplier op (cu=1). Integer forms exact, fractional forms 1.31 approx."""
    n, x, y = v["n"], v["x"], v["y"]
    if op == 0x30:
        return f"{n} = {x} f* {y}; setfmul({n});"
    hi = op >> 6
    if hi == 0:
        if op in (0x14,):
            return "MRF = 0;"
        if op in (0x16,):
            return "MRB = 0;"
        if ((op >> 1) & 3) < 2:
            return f"{n} = mrop({op:#x}:4);"
        return f"mrop({op:#x}:4);"
    ys, xs, frac = (op >> 5) & 1, (op >> 4) & 1, (op >> 3) & 1   # rounding (bit 0) not modelled
    ex = lambda r, s: f"sext({r})" if s else f"zext({r})"
    prod = f"({ex(x, xs)} * {ex(y, ys)})"
    if frac:
        prod = f"({prod} << 1)"
    dst = (op >> 1) & 3
    acc = "MRB" if dst & 1 else "MRF"
    if hi == 1:
        if dst == 0:
            return (f"local p:8 = {prod}; {n} = p({4 if frac else 0}); setmul({n});")
        if dst == 1:
            return None
        return f"{acc} = {prod};"
    sign = "+" if hi == 2 else "-"
    if dst < 2:
        return f"local p:8 = {acc} {sign} {prod}; {n} = p({4 if frac else 0}); setmul({n});"
    return f"{acc} = {acc} {sign} {prod};"


def mf_sem(op6, v):
    m, a = v["m"], v["a"]
    xm, ym, xa, ya = v["xm"], v["ym"], v["xa"], v["ya"]
    mul_i = f"local pm:8 = (sext({xm}) * sext({ym})) << 1; local tm:4 = pm(4);"
    mul_f = f"local tm:4 = {xm} f* {ym};"
    if op6 in (0x04, 0x05, 0x06, 0x0C, 0x0D, 0x0E, 0x14, 0x15, 0x16):
        acc = {0x04: "", 0x0C: "+", 0x14: "-"}[op6 & 0x1C] if (op6 & 0x1C) in (0x04, 0x0C, 0x14) else ""
        mul = mul_i if not acc else (f"local pm:8 = MRF {acc} ((sext({xm}) * sext({ym})) << 1); "
                                     f"local tm:4 = pm(4);")
        alu = {0: f"local ta:4 = {xa} + {ya};", 1: f"local ta:4 = {xa} - {ya};",
               2: f"local ta:4 = ({xa} + {ya}) s>> 1;"}[op6 & 3]
        return f"{mul} {alu} {m} = tm; {a} = ta; setfix({a});"
    if op6 in (0x08, 0x09, 0x0A, 0x10, 0x11, 0x12):
        sgn = "+" if op6 < 0x10 else "-"
        alu = {0: f"local ta:4 = {xa} + {ya};", 1: f"local ta:4 = {xa} - {ya};",
               2: f"local ta:4 = ({xa} + {ya}) s>> 1;"}[op6 & 3]
        return f"{alu} MRF = MRF {sgn} ((sext({xm}) * sext({ym})) << 1); {a} = ta; setfix({a});"
    if 0x18 <= op6 <= 0x1F:
        alu = {0x18: f"local ta:4 = {xa} f+ {ya};", 0x19: f"local ta:4 = {xa} f- {ya};",
               0x1A: f"local fa:4 = int2float({xa}); local ta:4 = scalb(fa, {ya});",
               0x1B: f"local sa:4 = scalb({xa}, {ya}); local ta:4 = trunc(round(sa));",
               0x1C: f"local ta:4 = ({xa} f+ {ya}) f* 0x3f000000:4;",
               0x1D: f"local ta:4 = abs({xa});",
               0x1E: f"local ta:4 = {xa}; if ({xa} f>= {ya}) goto <d>; ta = {ya}; <d>",
               0x1F: f"local ta:4 = {xa}; if ({xa} f<= {ya}) goto <d>; ta = {ya}; <d>"}[op6]
        return f"{mul_f} {alu} {m} = tm; {a} = ta; setflt({a});"
    return None


class Compute:
    """Generate compute subtables for a layout, in variants of prefix/suffix text."""

    def __init__(self, layout, name):
        self.L = layout
        self.name = name
        self.fm = reg_fields(layout, name)
        self.v = sem_vars(self.fm)
        self.ops = []            # (pattern, display_template, pcode)
        self._build()

    def add(self, i32c, i16c, template, pcode):
        d, used = disp(template, self.fm)
        # semantic operands are the R-attached fields for the same keys
        keys = set(re.findall(r"[RF]\{(\w+)\}", template))
        need = set(used) | {self.fm[("R", k)] for k in keys}
        need |= {fld for fld in self.v.values() if pcode and re.search(rf"\b{fld}\b", pcode)}
        i32c, i16c = list(i32c), list(i16c)
        for n in sorted(need):
            (i32c if FL.tok_of(n) == "i32" else i16c).append(n)
        self.ops.append((self.L.pattern(i32c, i16c), d, pcode or ""))

    def _sem(self, body):
        return body.format(**self.v) if body else None

    def _build(self):
        L, v = self.L, self.v
        mf, cu = L.fld(22, 22), L.fld(21, 20)
        # single function ALU
        for op, tmpl in S.ALU.items():
            a, b = L.op8(op)
            t = tmpl.replace("{n}", "{n}").replace("{x}", "{x}").replace("{y}", "{y}")
            self.add([f"{mf}=0", f"{cu}=0", a], [b], t, self._sem(ALU_SEM.get(op)))
        for hi4, fl in ((0x7, False), (0xF, True)):     # dual add/sub
            if L.name == "2b":
                c = [f"{mf}=0", f"{cu}=0", f"{L.fld(19, 16)}={hi4:#x}"]
                c2 = []
            else:
                c = [f"{mf}=0", f"{cu}=0", f"{L.fld(19, 16)}={hi4:#x}"]
                c2 = []
            p = "F" if fl else "R"
            tmpl = f"{p}{{n}} = {p}{{x}} + {p}{{y}}, {p}{{s}} = {p}{{x}} - {p}{{y}}"
            op = "f+" if fl else "+"
            opm = "f-" if fl else "-"
            sem = (f"local ta:4 = {v['x']} {op} {v['y']}; local ts:4 = {v['x']} {opm} {v['y']}; "
                   f"{v['n']} = ta; {v['s']} = ts;")
            self.add(c, c2, tmpl, sem)
        # multiplier
        for op in range(256):
            t = S.mult_text(op, 0, 0, 0)
            if not t:
                continue
            t = S.mult_text(op, "{n}", "{x}", "{y}")
            a, b = L.op8(op)
            self.add([f"{mf}=0", f"{cu}=1", a], [b], t, self._sem(mult_sem(op, {k: "{" + k + "}" for k in v})))
        # shifter
        for op, tmpl in S.SHIFT.items():
            a, b = L.op8(op)
            t = tmpl.format(n="{n}", x="{x}", y="R{y}", f="R{y}", b="R{y}", w="R{x}")
            sem = SHIFT_SEM.get(op)
            if sem is None:
                sem = "{n} = shiftop({x}, {y}, " + f"{op:#x}:1); setsz({{n}});"
            self.add([f"{mf}=0", f"{cu}=2", a], [b], t, self._sem(sem))
        # multifunction
        op6 = L.fld(21, 16)
        for code, tmpl in S.MULALU.items():
            t = tmpl.replace("{m}", "{m}")
            sem = mf_sem(code, {k: "{" + k + "}" for k in v})
            self.add([f"{mf}=1", f"{op6}={code:#x}"], [], t, self._sem(sem))
        fx = L.fld(21, 20, kind="mfd")
        for fl in (0, 1):
            p = "F" if fl else "R"
            if fl:
                t = "F{m} = F{xm} * F{ym}, F{a} = F{xa} + F{ya}, F{s2} = F{xa} - F{ya}"
                sem = ("local tm:4 = {xm} f* {ym}; local ta:4 = {xa} f+ {ya}; local ts:4 = {xa} f- {ya}; "
                       "{m} = tm; {a} = ta; {s2} = ts;")
            else:
                t = "R{m} = R{xm} * R{ym} (SSFR), R{a} = R{xa} + R{ya}, R{s2} = R{xa} - R{ya}"
                sem = ("local pm:8 = (sext({xm}) * sext({ym})) << 1; local ta:4 = {xa} + {ya}; "
                       "local ts:4 = {xa} - {ya}; {m} = pm(4); {a} = ta; {s2} = ts;")
            self.add([f"{mf}=1", f"{fx}={2 | fl}"], [], t, self._sem(sem))
        mrd = L.fld(21, 17, kind="mr")
        dbit = L.fld(16, 16)
        for code, mr in S.MRREG.items():
            sel = L.fld(15, 12, kind="mrsel")
            word = {"MR0F": "MRF[0,32]", "MR1F": "MRF[32,32]", "MR2F": "MRF2",
                    "MR0B": "MRB[0,32]", "MR1B": "MRB[32,32]", "MR2B": "MRB2"}[mr]
            n = self.v["n"]
            self.add([f"{mf}=1", f"{mrd}=0", f"{dbit}=0"], [f"{sel}={code}"], f"R{{n}} = {mr}",
                     f"{n} = {word};")
            self.add([f"{mf}=1", f"{mrd}=0", f"{dbit}=1"], [f"{sel}={code}"], f"{mr} = R{{n}}",
                     f"{word} = {n};")

    def render(self, sub, prefix="", suffix="", zero_display=""):
        """One subtable `sub`: each op displayed as prefix+op+suffix; compute==0 -> zero_display."""
        out = []
        # null compute
        if self.L.name == "2b":
            zpat = f"{FL.f(38, 16)}=0"
        else:
            zpat = f"{FL.f(22, 16)}=0 ; {FL.f(15, 0)}=0"
        zd = f'"{zero_display}"' if zero_display else ""
        out.append(f"{sub}: {zd} is {zpat} {{ }}")
        pre = f'"{prefix}"^' if prefix else ""
        suf = f'^"{suffix}"' if suffix else ""
        for pat, d, pcode in self.ops:
            out.append(f"{sub}: {pre}{d}{suf} is {pat} {{ {pcode} }}")
        return "\n".join(out)




# ------------------------------------------------------------------ conditions
# Condition codes (PGR Table 10-4; meanings in Table 4-37).  15 is NOT LCE: the loop counter expires on the
# iteration in which CURLCNTR is 1.  31 is TRUE (no IF displayed).
COND_EXPR = {0: "AZ", 1: "AN", 2: "AN | AZ", 3: "AC", 4: "AV", 5: "MV", 6: "MS", 7: "SV",
             8: "SZ", 9: "FLAG0", 10: "FLAG1", 11: "FLAG2", 12: "FLAG3", 13: "BTF", 14: "BM",
             15: "CURLCNTR != 1", 31: "1"}
for _k in range(16, 31):
    COND_EXPR[_k] = f"!({COND_EXPR[_k - 16]})"


def cond_tables():
    """CC (all 32 codes, for the ISA-only type 10), CCN/CCN16 (0..30, for conditional
    instructions, whose TRUE form is a separate constructor), and LTERM (the
    DO UNTIL termination condition, read from the loop-end context)."""
    cc = []
    for tab, fld in (("CC", FL.f(37, 33)),):
        for k, nm in enumerate(COND_NAMES):
            if k == 31:
                cc.append(f"{tab}: is {fld}=31 {{ local t:1 = 1; export t; }}")
            else:
                cc.append(f'{tab}: "IF {nm} " is {fld}={k} {{ local t:1 = {COND_EXPR[k]}; export t; }}')
    for tab, fld in (("CCN", FL.f(37, 33)), ("CCN16", FL.f(37, 33, tok="s16"))):
        for k, nm in enumerate(COND_NAMES[:31]):
            cc.append(f'{tab}: "IF {nm} " is {fld}={k} {{ local t:1 = {COND_EXPR[k]}; export t; }}')
    for k in range(31):
        if k != 15:
            cc.append(f"LTERM: is lterm={k} {{ local t:1 = {COND_EXPR[k]}; export t; }}")
    return "\n".join(cc)


def gen():
    C48 = Compute(Layout("48"), "c48")
    C2B = Compute(Layout("2b"), "c2b")
    parts = [cond_tables()]
    parts.append(C48.render("CMP48"))                          # bare
    parts.append(C48.render("CMP48s", suffix=", "))            # followed by a move
    parts.append(C48.render("CMP48p", prefix=", "))            # after a branch
    parts.append(C48.render("CMP48e", prefix=", ELSE "))       # else-compute
    parts.append(C2B.render("CMP2B"))
    parts += instr_types()
    return parts


# ------------------------------------------------------------------ branch targets
def map48(t):
    """SLEIGH pattern expression mapping a PM address `t` to the code-space address.

    Short-word (SW) addresses 0x100000..0x1fffff are used as they are.  A 48-bit address
    in 0x80000..0xfffff (blocks 0-3) is replaced by its physical SW alias, where the
    instruction's three parcels are stored: SW = 3*A - (A & 0xe0000) (block 0 0x8c000 ->
    0x124000, block 1 0xac000 -> 0x164000, block 2 0xc0000 -> 0x180000, block 3 0xe0000 ->
    0x1c0000).  There are no conditionals in pattern expressions, so the choice is made
    arithmetically with s48 = bit 19 and not bit 20."""
    s48 = f"((({t}) >> 19) & 1 & ~(({t}) >> 20))"
    return f"({t}) + {s48} * (2 * ({t}) - (({t}) & {MASK48}))"


def targets():
    f = FL.f
    lo16 = f(15, 0)
    a24hi = f(23, 16)
    rel24hi = f(23, 16, signed=True)
    r6 = f(32, 27, signed=True)
    if PLUS:
        rel23hi = f(22, 16, signed=True)
        domode = f(23, 23)
    t_abs = f"(({a24hi} << 16) | {lo16})"
    t_rel = f"(inst_start + (({rel24hi} << 16) | {lo16}))"
    return "\n".join([
        # absolute (types 8, 25): a 24-bit PM address
        f"ABS24: tgt is {a24hi} ; {lo16} [ tgt = {map48(t_abs)}; ] {{ export *:4 tgt; }}",
        # PC-relative, 24-bit: VISA offsets are in short words and may cross into 48-bit
        # code (the linker emits them for jumps to ISA stubs); ISA offsets are in 48-bit
        # words, i.e. three code units in the alias
        f"REL24: tgt is visa=1 & {rel24hi} ; {lo16} [ tgt = {map48(t_rel)}; ] {{ export *:4 tgt; }}",
        f"REL24: tgt is visa=0 & {rel24hi} ; {lo16} [ tgt = inst_start + (({rel24hi} << 16) | {lo16}) * 3; ] {{ export *:4 tgt; }}",
        f"REL6: tgt is visa=1 & {r6} [ tgt = inst_start + {r6}; ] {{ export *:4 tgt; }}",
        f"REL6: tgt is visa=0 & {r6} [ tgt = inst_start + {r6} * 3; ] {{ export *:4 tgt; }}",
    ] + ([
        # SHARC+ DO end address (types 12a/13a): 23-bit PC-relative, bit 23 is the mode bit
        f"REL23: tgt is visa=1 & {rel23hi} ; {lo16} [ tgt = inst_start + (({rel23hi} << 16) | {lo16}); ] {{ export *:4 tgt; }}",
        f"REL23: tgt is visa=0 & {rel23hi} ; {lo16} [ tgt = inst_start + (({rel23hi} << 16) | {lo16}) * 3; ] {{ export *:4 tgt; }}",
        f'DOMODE: "" is {domode}=0 {{ }}',
        f'DOMODE: " (F)" is {domode}=1 {{ }}',
    ] if PLUS else []))


def flow(kind, tgt, cond, db, la=False):
    """p-code for the control transfer of a branch whose condition (if any) is in local `c`.

    The delay slots (DS) run whether or not the branch is taken, so they come first; the
    not-taken path then falls through to the instruction after the slots.  `goto inst_next`
    is never used: for a delayed branch it would re-enter the first delay slot."""
    pre = "build DS; " if db else ""
    popl = "popLoop(); " if la else ""
    if kind == "jump" and cond and not la:
        return pre + f"if (c) goto {tgt};"
    body = {"jump": f"{popl}goto {tgt};", "call": f"call {tgt};", "ijump": f"{popl}goto [{tgt}];",
            "icall": f"call [{tgt}];", "ret": f"return [{tgt}];"}[kind]
    if cond:
        return pre + f"if (!c) goto <end>; {body} <end>"
    return pre + body


def mods(j=0, la=0, ci=0, lr=0):
    """Display pieces for the branch modifiers."""
    return [f'" {txt}"' for flag, txt in ((j, "(DB)"), (la, "(LA)"), (ci, "(CI)"), (lr, "(LR)")) if flag]


def dj(*pieces):
    """Join display pieces (strings or lists of strings) with ^, dropping empty ones."""
    flat = []
    for p in pieces:
        flat += p if isinstance(p, list) else [p]
    flat = [x for x in flat if x]
    if flat and flat[0].startswith('" '):     # the mnemonic's own space separates it
        flat[0] = '"' + flat[0][2:]
    return "^".join(flat)


def instr_types():
    """`instr` constructors for every instruction type (48-bit shared, 32/16-bit VISA-only)."""
    f, regs, names = FL.f, FL.regs, FL.names
    out = [targets()]
    I1 = [f"I{i}" for i in range(8)]
    I2 = [f"I{i}" for i in range(8, 16)]
    M1 = [f"M{i}" for i in range(8)]
    M2 = [f"M{i}" for i in range(8, 16)]
    lo16 = f(15, 0)
    ureg29 = FL.regs(29, 23, UREG)                  # type 3 ureg
    ureg38 = FL.regs(38, 32, UREG)                  # types 14,15a,17
    dest5 = FL.regs(29, 23, UREG, kind="d")         # type 5 dest (same bits as ureg29)
    # Loading Bn also loads In (PGR "Circular Buffering Mode": "When the B register is
    # loaded, the corresponding I register is simultaneously loaded with the same value").
    # A companion field over the same ureg bits names In for the B codes and the scratch
    # register BIX (never read) for every other code; each ureg load writes both.
    bi_regs = [f"I{k - 64}" if 64 <= k < 80 else "BIX" for k in range(128)]
    bi29 = FL.regs(29, 23, bi_regs, kind="bi")
    bi38 = FL.regs(38, 32, bi_regs, kind="bi")
    nocomp = f"{f(22, 16)}=0x3f"                    # VISA 32-bit form: compute field absent
    cnt = [0]

    def mem(space_g, d, ir, mr, reg, post=True, lw=False, bi=None):
        """Display and p-code for a DAG access; ir/mr are operand fields (mr may be an
        immediate).  Returns (display, pre, post): `pre` captures a stored register before
        any compute in the same instruction writes it (all sources are read before any
        destination is written), `post` performs the access and the post-modify."""
        sp = "PM" if space_g else "DM"
        ea = f'{ir}^", "^{mr}' if post else f'{mr}^", "^{ir}'
        if d:
            dsp = f'"{sp}("^{ea}^") = "^{reg}'
        else:
            dsp = f'{reg}^" = {sp}("^{ea}^")"'
        if lw:
            dsp += '^" (LW)"'
        cnt[0] += 1
        n = cnt[0] % 2
        addr = f"{ir}" if post else f"({ir} + {mr})"
        upd = f" {ir} = {ir} + {mr};" if post else ""
        if d:
            return dsp, f"local sv{n}:4 = {reg};", f"*[dm]:4 {addr} = sv{n};{upd}"
        also = f" {bi} = lv{n};" if bi else ""
        return dsp, "", f"local lv{n}:4 = *[dm]:4 {addr};{upd} {reg} = lv{n};{also}"

    def cond_body(cc, *stmts):
        """A conditional non-branch instruction: everything is skipped when `cc` is false."""
        return f"build {cc}; if (!{cc}) goto <skip>; " + " ".join(s for s in stmts if s) + " <skip>"

    # ---------------- Type 1 (compute + dual move)
    dmd, pmd = f(44, 44), f(37, 37)
    dmi, dmm = regs(43, 41, I1), regs(40, 38, M1)
    pmi, pmm = regs(32, 30, I2), regs(29, 27, M2)
    dmr, pmr = regs(36, 33, R), regs(26, 23, R)
    for dd in (0, 1):
        for pd in (0, 1):
            a_d, a_pre, a_p = mem(0, dd, dmi, dmm, dmr)
            b_d, b_pre, b_p = mem(1, pd, pmi, pmm, pmr)
            base = f"{f(47, 45)}=1 & {dmd}={dd} & {pmd}={pd} & {dmi} & {dmm} & {dmr} & {pmi} & {pmm} & {pmr}"
            out.append(f'instr: PAR CMP48s^{a_d}^", "^{b_d} is ({base}) ... & CMP48s '
                       f'{{ {a_pre} {b_pre} build CMP48s; {a_p} {b_p} }}')
            out.append(f'instr: PAR {a_d}^", "^{b_d} is visa=1 & {base} & {nocomp} '
                       f'{{ {a_pre} {b_pre} {a_p} {b_p} }}')
    # ---------------- Type 2
    out.append(f"instr: COMP CC^CMP48 is ({f(47, 40)}=0x01 & {f(39, 39)}=0 & CC) ... & CMP48 "
               f"{{ {cond_body('CC', 'build CMP48;')} }}")
    out.append(f"instr: COMP CMP2B is visa=1 & {f(47, 40)}=0x01 & {f(39, 39)}=1 & CMP2B {{ build CMP2B; }}")
    # 2c short compute (16-bit)
    sop = f(43, 40, tok="s16")
    sn = regs(39, 36, R, tok="s16")
    sn2 = regs(39, 36, R, tok="s16", kind="b")
    sx = regs(35, 32, R, tok="s16")
    fn_ = names(39, 36, F, tok="s16")
    fn2 = names(39, 36, F, tok="s16", kind="b")
    fx_ = names(35, 32, F, tok="s16")
    short_sem = ["{n} = {n} + {x}; setfix({n});", "{n} = {n} - {x}; setfix({n});",
                 "{n} = {x}; setfix({n});", "AZ = ({n} == {x}); AN = ({n} s< {x});",
                 "{n} = ~{x}; setfix({n});", "{n} = {x} + 1; setfix({n});", "{n} = {x} - 1; setfix({n});",
                 "{n} = {n} * {x}; setmul({n});", "{n} = {n} f+ {x}; setflt({n});",
                 "{n} = {n} f- {x}; setflt({n});", "{n} = int2float({x}); setflt({n});",
                 "AZ = ({n} f== {x}); AN = ({n} f< {x});", "{n} = {n} & {x}; setfix({n});",
                 "{n} = {n} | {x}; setfix({n});", "{n} = {n} ^ {x}; setfix({n});",
                 "{n} = {n} f* {x}; setfmul({n});"]
    for op, tmpl in enumerate(S.SHORT):
        fm = {("R", "n"): sn, ("R", "x"): sx, ("F", "n"): fn_, ("F", "x"): fx_}
        first = {"R": True, "F": True}

        def sub(m):
            p, k = m.group(1), m.group(2)
            if k == "n":
                if first[p]:
                    first[p] = False
                    return f"{p}{{n}}"
                return f"{p}{{n2}}"
            return m.group(0)
        t2 = re.sub(r"([RF])\{(\w+)\}", sub, tmpl)
        fm[("R", "n2")] = sn2
        fm[("F", "n2")] = fn2
        d, used = disp(t2, fm)
        sem = short_sem[op].format(n=sn, x=sx)
        flds = " & ".join(sorted(set(used) | {sn, sx}))
        out.append(f"instr: SCOMP {d} is visa=1 & {f(47, 44, tok='s16')}=0xc & {sop}={op} & {flds} {{ {sem} }}")
    # ---------------- Type 3 (ureg <-> DM/PM, I/M register)
    u, g, d_, lw = f(44, 44), f(32, 32), f(31, 31), f(30, 30)
    for gg in (0, 1):
        ir = regs(43, 41, I2 if gg else I1, kind=f"g{gg}")
        mr = regs(40, 38, M2 if gg else M1, kind=f"g{gg}")
        for uu in (0, 1):
            for dd in (0, 1):
                for ll in (0, 1):
                    dsp, pre, pc = mem(gg, dd, ir, mr, ureg29, post=bool(uu), lw=bool(ll),
                                       bi=None if dd else bi29)
                    base = (f"{f(47, 45)}=2 & {u}={uu} & {g}={gg} & {d_}={dd} & {lw}={ll} & "
                            f"{ir} & {mr} & {ureg29}" + ("" if dd else f" & {bi29}"))
                    out.append(f"instr: MOVE CC^CMP48s^{dsp} is ({base} & CC) ... & CMP48s "
                               f"{{ {cond_body('CC', pre, 'build CMP48s;', pc)} }}")
                    out.append(f"instr: MOVE CC^{dsp} is visa=1 & {base} & CC & {nocomp} "
                               f"{{ {cond_body('CC', pre, pc)} }}")
    # 3c (16-bit): 1001 DMI DMM D 1 DREG
    s_dmi, s_dmm = regs(43, 41, I1, tok="s16"), regs(40, 38, M1, tok="s16")
    s_d, s_r = f(37, 37, tok="s16"), regs(35, 32, R, tok="s16", kind="c")
    for dd in (0, 1):
        dsp, pre, pc = mem(0, dd, s_dmi, s_dmm, s_r)
        out.append(f"instr: MOVE {dsp} is visa=1 & {f(47, 44, tok='s16')}=0x9 & {f(36, 36, tok='s16')}=1 & "
                   f"{s_d}={dd} & {s_dmi} & {s_dmm} & {s_r} {{ {pre} {pc} }}")
    # ---------------- Type 4 (6-bit immediate modifier, dreg)
    d6 = f(32, 27, signed=True)
    dreg4 = regs(26, 23, R, kind="t4")
    gb, db, ub = f(40, 40), f(39, 39), f(38, 38)
    for gg in (0, 1):
        ir = regs(43, 41, I2 if gg else I1, kind=f"g{gg}")
        for uu in (0, 1):
            for dd in (0, 1):
                dsp, pre, pc = mem(gg, dd, ir, d6, dreg4, post=bool(uu))
                base = f"{f(47, 44)}=0x6 & {gb}={gg} & {db}={dd} & {ub}={uu} & {ir} & {d6} & {dreg4}"
                out.append(f"instr: MOVE CC^CMP48s^{dsp} is ({base} & CC) ... & CMP48s "
                           f"{{ {cond_body('CC', pre, 'build CMP48s;', pc)} }}")
                out.append(f"instr: MOVE CC^{dsp} is visa=1 & {base} & CC & {nocomp} "
                           f"{{ {cond_body('CC', pre, pc)} }}")
    # ---------------- Type 5 (ureg = ureg ; dreg <-> cdreg)
    srch, srcl = f(42, 38), f(32, 31)
    srcsub = []
    for code, nm in enumerate(UREG):
        srcsub.append(f'SRCU: "{nm}" is {srch}={code >> 2} & {srcl}={code & 3} {{ export {nm}; }}')
    out.append("\n".join(srcsub))
    base5 = f"{f(47, 43)}=0xE & {dest5} & {bi29} & SRCU"
    mv5 = f"{dest5} = t5; {bi29} = t5;"
    out.append(f'instr: MOVE CC^CMP48s^{dest5}^" = "^SRCU is ({base5} & CC) ... & CMP48s '
               f'{{ {cond_body("CC", "local t5:4 = SRCU;", "build CMP48s;", mv5)} }}')
    out.append(f'instr: MOVE CC^{dest5}^" = "^SRCU is visa=1 & {base5} & CC & {nocomp} '
               f'{{ {cond_body("CC", "local t5:4 = SRCU;", mv5)} }}')
    cdr = regs(41, 38, [f"S{i}" for i in range(16)])
    swr = regs(26, 23, R, kind="sw")
    base5s = f"{f(47, 43)}=0xF & {cdr} & {swr}"
    swp_pre = f"local ts:4 = {swr}; local tc:4 = {cdr};"
    swp = f"{swr} = tc; {cdr} = ts;"
    out.append(f'instr: SWAP CC^CMP48s^{swr}^" <-> "^{cdr} is ({base5s} & CC) ... & CMP48s '
               f'{{ {cond_body("CC", swp_pre, "build CMP48s;", swp)} }}')
    out.append(f'instr: SWAP CC^{swr}^" <-> "^{cdr} is visa=1 & {base5s} & CC & {nocomp} '
               f'{{ {cond_body("CC", swp_pre, swp)} }}')
    # ---------------- Type 6 (shift immediate [+ move]); SHIFTIM: 6-bit op at 21..16,
    # data8 at 15..8, Rn 7..4, Rx 3..0; DATAEX (30..27) extends data to 12 bits (bit6:len6).
    sh_rn, sh_rx = regs(7, 4, R, kind="sh"), regs(3, 0, R, kind="sh")
    sh_d8 = f(15, 8, signed=True)
    sh_bit = f(13, 8, kind="bit")
    sh_lenlo = f(15, 14, kind="lenlo")
    dataex = f(30, 27)
    shsub = []
    for op, tmpl in S.SHIFT.items():
        op6 = op >> 2
        t = (tmpl.replace("R{n}", "\x01").replace("R{x}", "\x02")
             .replace("{y}", "\x03").replace("{f}", "\x04").replace("{b}", "\x05").replace("{w}", "\x05"))
        used = []

        def opnd(tag):
            base = {"\x01": sh_rn, "\x02": sh_rx, "\x03": sh_d8}.get(tag)
            if base is None:
                return {"\x04": f'{sh_bit}^":"^len6', "\x05": "imm12"}[tag]
            n = FL.alias(base) if base in used else base
            used.append(n)
            return n
        parts = re.split("([\x01-\x05])", t)
        dd = "^".join(opnd(p) if p and p in "\x01\x02\x03\x04\x05" else f'"{p}"' for p in parts if p)
        pat_i16 = set(used) | {sh_rn, sh_rx, sh_d8}
        acts = ""
        variants = [("", None)]
        if "\x04" in t:
            pat_i16 |= {sh_bit, sh_lenlo}
            acts = f"[ len6 = ({dataex} << 2) | {sh_lenlo}; ]"
            sem = FIELD_SEM.get(op)
            if sem:
                sem = sem.format(n=sh_rn, x=sh_rx, b=sh_bit, l="len6") + f" setsz({sh_rn});"
            else:
                sem = f"local b6:4 = {sh_bit}; local l6:4 = len6; {sh_rn} = shiftop({sh_rx}, b6, l6, {op:#x}:1); setsz({sh_rn});"
        elif "\x05" in t:
            pat_i16 |= {FL.f(15, 8, kind="u")}
            acts = f"[ imm12 = ({dataex} << 8) | {FL.f(15, 8, kind='u')}; ]"
            sem = f"local k:4 = imm12; {sh_rn} = shiftop({sh_rx}, k, {op:#x}:1); setsz({sh_rn});"
        elif op in IMM_SHIFT_SEM:
            # the count is a constant: one constructor per sign, so no run-time test
            sign = f(15, 15)
            variants = [(f" & {sign}={neg}", IMM_SHIFT_SEM[op][neg].format(n=sh_rn, x=sh_rx, k=sh_d8))
                        for neg in (0, 1)]
            sem = None
        else:
            body = SHIFT_SEM.get(op)
            if body:
                sem = f"local k:4 = {sh_d8}; " + body.format(n=sh_rn, x=sh_rx, y="k")
            else:
                sem = f"local k:4 = {sh_d8}; {sh_rn} = shiftop({sh_rx}, k, {op:#x}:1); setsz({sh_rn});"
        pat_i16 = sorted(pat_i16)
        for extra, vsem in variants:
            shsub.append(f"SHIMM: {dd} is {f(22, 22)}=0 & {f(21, 16)}={op6:#x} & {dataex} ; "
                         f"{' & '.join(pat_i16)}{extra} {acts} {{ {vsem or sem} }}")
    out.append("\n".join(shsub))
    for gg in (0, 1):
        ir = regs(43, 41, I2 if gg else I1, kind=f"g{gg}")
        mr = regs(40, 38, M2 if gg else M1, kind=f"g{gg}")
        for dd in (0, 1):
            dsp, pre, pc = mem(gg, dd, ir, mr, dreg4)
            base = f"{f(47, 44)}=0x8 & {g}={gg} & {d_}={dd} & {ir} & {mr} & {dreg4}"
            out.append(f'instr: SHIFT CC^SHIMM^", "^{dsp} is ({base} & CC) ... & SHIMM '
                       f'{{ {cond_body("CC", pre, "build SHIMM;", pc)} }}')
    out.append(f"instr: SHIFT CC^SHIMM is ({f(47, 40)}=0x02 & CC) ... & SHIMM "
               f"{{ {cond_body('CC', 'build SHIMM;')} }}")
    # ---------------- Type 7 (index modify)
    for gg in (0, 1):
        isr = regs(32, 30, I2 if gg else I1, kind=f"s{gg}")
        mm = regs(29, 27, M2 if gg else M1, kind=f"s{gg}")
        idx = f(26, 24)
        dst_sub = []
        base_nm = f"IDST{gg}"
        for s in range(8):
            for x in range(8):
                src = (8 if gg else 0) + s
                dst = (8 if gg else 0) + (s ^ x)
                if x == 0:
                    dst_sub.append(f'{base_nm}: is {f(32, 30)}={s} & {idx}=0 {{ export I{src}; }}')
                else:
                    dst_sub.append(f'{base_nm}: "I{dst} = " is {f(32, 30)}={s} & {idx}={x} {{ export I{dst}; }}')
        out.append("\n".join(dst_sub))
        base = f"{f(47, 40)}=0x04 & {f(38, 38)}={gg} & {isr} & {mm} & {base_nm}"
        mod = f"build {base_nm}; {base_nm} = {isr} + {mm};"
        out.append(f'instr: MODIFY CC^CMP48s^{base_nm}^"MODIFY("^{isr}^", "^{mm}^")" is ({base} & CC) ... & CMP48s '
                   f'{{ {cond_body("CC", "build CMP48s;", mod)} }}')
        out.append(f'instr: MODIFY CC^{base_nm}^"MODIFY("^{isr}^", "^{mm}^")" is visa=1 & {base} & CC & {nocomp} '
                   f'{{ {cond_body("CC", mod)} }}')

    # ---------------- branches
    b39, la38, j26, e25, ci24 = f(39, 39), f(38, 38), f(26, 26), f(25, 25), f(24, 24)
    ccf = f(37, 33)

    def cc_forms(cc="CCN", field=ccf):
        """(conditional?, pattern fragment, display, p-code prologue): a branch exists
        once per condition code 0..30 and once for TRUE, whose flow is unconditional."""
        return [(True, cc, cc, f"build {cc}; local c:1 = {cc};"),
                (False, f"{field}=31", "", "")]

    # Type 8: direct / PC-relative jump or call
    for rel in (0, 1):
        tg = "REL24" if rel else "ABS24"
        for b in (0, 1):
            for j in (0, 1):
                for la in (0, 1):
                    for ci in (0, 1):
                        for cond, cpat, cdsp, cpro in cc_forms():
                            mn = "CALL" if b else "JUMP"
                            base = (f"{f(47, 41)}=3 & {f(40, 40)}={rel} & {b39}={b} & {la38}={la} & "
                                    f"{j26}={j} & {ci24}={ci} & {cpat}" + (" & DS" if j else ""))
                            body = flow("call" if b else "jump", tg, cond, j, la=la and not b)
                            dsp = dj(cdsp, ['"("', tg, '")"'], mods(j, la, ci))
                            out.append(f'instr: {mn} {dsp} is ({base}) ... & {tg} '
                                       f'{{ {cpro} {body} }}')
    # Type 9: indirect (Md, Ic) or PC-relative 6-bit, with compute (48-bit) or without (9b).
    # The VisualDSP++ function return, JUMP (M14, I12) (DB) (I12 = the saved PC, M14 = 1),
    # gets its own, more specific constructor.  Its calls through JUMP (DB), which store the
    # return address in a delay slot, are recognised by the SHARC Call Idiom analyzer.
    ipmi, ipmm = regs(32, 30, I2, kind="ind"), regs(29, 27, M2, kind="ind")
    for rel in (0, 1):
        for b in (0, 1):
            for j in (0, 1):
                for la in (0, 1):
                    for ci in (0, 1):
                        variants = [("", "call" if b else "jump")]
                        if not rel and not b and j and not la and not ci:
                            variants.append((f" & {ipmi}=4 & {ipmm}=6", "ret"))
                        for extra, kind in variants:
                            if rel:
                                dst, pre, tgt = ['"("', "REL6", '")"'], "", "REL6"
                                ops = " & REL6"
                            else:
                                dst = ['"("', ipmm, '", "', ipmi, '")"']
                                pre, tgt = f"local tg:4 = {ipmi} + {ipmm}; pmcode(tg, ISA);", "tg"
                                ops = f" & {ipmi} & {ipmm} & ISA"
                                kind = {"jump": "ijump", "call": "icall"}.get(kind, kind)
                            mn = "CALL" if b else "JUMP"
                            for cond, cpat, cdsp, cpro in cc_forms():
                                base = (f"{f(47, 41)}=4 & {f(40, 40)}={rel} & {b39}={b} & {la38}={la} & "
                                        f"{j26}={j} & {ci24}={ci} & {cpat}{ops}{extra}" + (" & DS" if j else ""))
                                body = flow(kind, tgt, cond, j, la=la and not b)
                                for e in (0, 1):
                                    cmp = "CMP48e" if e else "CMP48p"
                                    if cond:
                                        gate = "if (c) goto <nc>;" if e else "if (!c) goto <nc>;"
                                        cpart = f"{gate} build {cmp}; <nc>"
                                    else:
                                        cpart = "" if e else f"build {cmp};"
                                    out.append(
                                        f'instr: {mn} {dj(cdsp, dst, mods(j, la, ci), cmp)} is ({base} & {e25}={e}) ... & {cmp} '
                                        f'{{ {cpro} {pre} {cpart} {body} }}')
                                out.append(
                                    f'instr: {mn} {dj(cdsp, dst, mods(j, la, ci))} is visa=1 & {base} & {e25}=0 & {nocomp} '
                                    f'{{ {cpro} {pre} {body} }}')
    # Type 10 (ISA only): IF cond JUMP (Md, Ic) / (PC, rel6), ELSE compute, DM move
    t10d, t10i, t10m, t10r = f(44, 44), regs(43, 41, I1, kind="t10"), regs(40, 38, M1, kind="t10"), regs(26, 23, R, kind="t10")
    for rel in (0, 1):
        for dd in (0, 1):
            dsp, mpre, pc = mem(0, 1 - dd, t10i, t10m, t10r)
            if rel:
                dst, pre, go, extra = '"("^REL6^")"', "", "goto REL6;", " & REL6"
            else:
                dst, pre, go, extra = (f'"("^{ipmm}^", "^{ipmi}^")"', f"local tg:4 = {ipmi} + {ipmm}; pmcode(tg, ISA);",
                                       "goto [tg];", f" & {ipmi} & {ipmm} & ISA")
            out.append(f'instr: JUMP CC^{dst}^", ELSE "^CMP48s^{dsp} is (visa=0 & {f(47, 45)}={6 + rel} & {t10d}={dd} & {t10i} & {t10m} & {t10r} & CC{extra}) ... & CMP48s '
                       f'{{ build CC; local c:1 = CC; {pre} if (!c) goto <nt>; {go} <nt> {mpre} build CMP48s; {pc} }}')
    # Type 11: RTS / RTI with compute (48-bit) and 11c (16-bit)
    lr24 = f(24, 24, kind="lr")
    ccf16 = f(37, 33, tok="s16")
    for rti in (0, 1):
        mn = "RTI" if rti else "RTS"
        for j in (0, 1):
            for lr in (0, 1):
                for cond, cpat, cdsp, cpro in cc_forms():
                    body = flow("ret", "PCSTK", cond, j)
                    for e in (0, 1):
                        cmp = "CMP48e" if e else "CMP48p"
                        if cond:
                            cpart = ("if (c) goto <nc>;" if e else "if (!c) goto <nc>;") + f" build {cmp}; <nc>"
                        else:
                            cpart = "" if e else f"build {cmp};"
                        base = (f"{f(47, 40)}={0x0A + rti} & {b39}=0 & {j26}={j} & {e25}={e} & {lr24}={lr} & {cpat}"
                                + (" & DS" if j else ""))
                        out.append(f'instr: {mn} {dj(cdsp, mods(j, lr=lr and not rti), cmp)} is ({base}) ... & {cmp} '
                                   f'{{ {cpro} {cpart} {body} }}')
                for cond, cpat, cdsp, cpro in cc_forms("CCN16", ccf16):
                    body = flow("ret", "PCSTK", cond, j)
                    base = (f"visa=1 & {f(47, 40, tok='s16')}={0x0A + rti} & {f(39, 39, tok='s16')}=1 & "
                            f"{f(38, 38, tok='s16')}={j} & {f(32, 32, tok='s16')}={lr} & {cpat}" + (" & DS" if j else ""))
                    out.append(f"instr: {mn} {dj(cdsp, mods(j, lr=lr and not rti))} is {base} {{ {cpro} {body} }}")
    # Types 12/13: DO loops.  The DO marks its loop-end instruction with context (lend,
    # lterm, ltop); the root table in sharc214xx.slaspec adds the loop-back there.  All forms
    # push the loop-counter stack and load CURLCNTR from LCNTR.
    lcd = FL.f(39, 32, kind="lch")
    lcl = FL.f(31, 24, kind="lcl")
    DOT = "REL23" if PLUS else "REL24"
    DOM = '^DOMODE' if PLUS else ''
    DOMP = ' & DOMODE' if PLUS else ''
    mark = (f"lend=1; ltop=inst_start+3; globalset({DOT}, lend); globalset({DOT}, lterm); "
            f"globalset({DOT}, ltop);")
    out.append(f'instr: DO "LCNTR = "^lcv^", DO ("^{DOT}^") UNTIL LCE"{DOM} is ({f(47, 40)}=0x0C & {lcd} & {lcl}{DOMP}) ... & {DOT} '
               f'[ lcv = ({lcd} << 8) | {lcl}; lterm=15; {mark} ] {{ LCNTR = lcv; pushLoop(); CURLCNTR = LCNTR; }}')
    out.append(f':DO "LCNTR = "^{ureg38}^", DO ("^{DOT}^") UNTIL LCE"{DOM} is ({f(47, 40)}=0x0D & {f(39, 39)}=0 & {ureg38}{DOMP}) ... & {DOT} '
               f'[ lterm=15; {mark} ] {{ LCNTR = {ureg38}; pushLoop(); CURLCNTR = LCNTR; }}'.replace(":DO", "instr: DO", 1))
    term = names(37, 33, TERM_NAMES, kind="term")
    out.append(f'instr: DO "DO ("^{DOT}^") UNTIL "^{term}{DOM} is ({f(47, 40)}=0x0E & {term}{DOMP}) ... & {DOT} '
               f'[ lterm={term}; {mark} ] {{ pushLoop(); CURLCNTR = LCNTR; }}')
    # ---------------- Type 14 DM(addr32) <-> ureg
    a32hi = f(31, 16)
    for gg in (0, 1):
        for dd in (0, 1):
            for ll in (0, 1):
                sp = "PM" if gg else "DM"
                lws = '^" (LW)"' if ll else ""
                if dd:
                    dsp = f'"{sp}("^a32^") = "^{ureg38}{lws}'
                    pc = f"local ea:4 = a32; *[dm]:4 ea = {ureg38};"
                else:
                    dsp = f'{ureg38}^" = {sp}("^a32^")"{lws}'
                    pc = f"local ea:4 = a32; {ureg38} = *[dm]:4 ea; {bi38} = {ureg38};"
                out.append(f"instr: MOVE {dsp} is {f(47, 42)}=0x04 & {f(41, 41)}={gg} & {f(40, 40)}={dd} & {f(39, 39)}={ll} & {ureg38} & {bi38} & {a32hi} ; {lo16} "
                           f"[ a32 = ({a32hi} << 16) | {lo16}; ] {{ {pc} }}")
    # Type 15a DM(data32, Ia) <-> ureg ; 15b DM(data7, Ia)
    for gg in (0, 1):
        ir = regs(43, 41, I2 if gg else I1, kind=f"g{gg}")
        for dd in (0, 1):
            for ll in (0, 1):
                sp = "PM" if gg else "DM"
                lws = '^" (LW)"' if ll else ""
                if dd:
                    dsp = f'"{sp}("^d32^", "^{ir}^") = "^{ureg38}{lws}'
                    pc = f"*[dm]:4 ({ir} + d32) = {ureg38};"
                else:
                    dsp = f'{ureg38}^" = {sp}("^d32^", "^{ir}^")"{lws}'
                    pc = f"{ureg38} = *[dm]:4 ({ir} + d32); {bi38} = {ureg38};"
                out.append(f"instr: MOVE {dsp} is {f(47, 45)}=5 & {f(44, 44)}={gg} & {ir} & {f(40, 40)}={dd} & {f(39, 39)}={ll} & {ureg38} & {bi38} & {a32hi} ; {lo16} "
                           f"[ d32 = ({a32hi} << 16) | {lo16}; ] {{ {pc} }}")
                d7 = f(22, 16, signed=True)
                if dd:
                    dsp = f'"{sp}("^{d7}^", "^{ir}^") = "^{ureg29}{lws}'
                    pc = f"*[dm]:4 ({ir} + {d7}) = {ureg29};"
                else:
                    dsp = f'{ureg29}^" = {sp}("^{d7}^", "^{ir}^")"{lws}'
                    pc = f"{ureg29} = *[dm]:4 ({ir} + {d7}); {bi29} = {ureg29};"
                out.append(f"instr: MOVE {dsp} is visa=1 & {f(47, 44)}=0x9 & {f(36, 34)}=2 & {f(37, 37)}={gg} & {ir} & {f(40, 40)}={dd} & {f(39, 39)}={ll} & {ureg29} & {bi29} & {d7} "
                           f"{{ {pc} }}")
    # Type 16a DM(Ia, Mb) = data32 ; 16b data16
    for gg in (0, 1):
        ir = regs(43, 41, I2 if gg else I1, kind=f"g{gg}")
        mr = regs(40, 38, M2 if gg else M1, kind=f"g{gg}")
        sp = "PM" if gg else "DM"
        out.append(f'instr: MOVE "{sp}("^{ir}^", "^{mr}^") = "^d32 is visa=0 & {f(47, 44)}=0x9 & {f(37, 37)}={gg} & {ir} & {mr} & {a32hi} ; {lo16} '
                   f'[ d32 = ({a32hi} << 16) | {lo16}; ] {{ *[dm]:4 {ir} = d32; {ir} = {ir} + {mr}; }}')
        out.append(f'instr: MOVE "{sp}("^{ir}^", "^{mr}^") = "^d32 is visa=1 & {f(47, 44)}=0x9 & {f(36, 34)}=0 & {f(37, 37)}={gg} & {ir} & {mr} & {a32hi} ; {lo16} '
                   f'[ d32 = ({a32hi} << 16) | {lo16}; ] {{ *[dm]:4 {ir} = d32; {ir} = {ir} + {mr}; }}')
        d16s = f(31, 16, signed=True)
        out.append(f'instr: MOVE "{sp}("^{ir}^", "^{mr}^") = "^{d16s} is visa=1 & {f(47, 44)}=0x9 & {f(36, 34)}=1 & {f(37, 37)}={gg} & {ir} & {mr} & {d16s} '
                   f'{{ local v:4 = {d16s}; *[dm]:4 {ir} = v; {ir} = {ir} + {mr}; }}')
    # Type 17 ureg = data32 / data16
    out.append(f'instr: MOVE {ureg38}^" = "^d32 is {f(47, 40)}=0x0F & {f(39, 39)}=0 & {ureg38} & {bi38} & {a32hi} ; {lo16} '
               f'[ d32 = ({a32hi} << 16) | {lo16}; ] {{ {ureg38} = d32; {bi38} = d32; }}')
    d16s = f(31, 16, signed=True)
    out.append(f'instr: MOVE {ureg38}^" = "^{d16s} is visa=1 & {f(47, 40)}=0x0F & {f(39, 39)}=1 & {ureg38} & {bi38} & {d16s} '
               f'{{ {ureg38} = {d16s}; {bi38} = {d16s}; }}')
    # Type 18 BIT op sreg data32
    sreg = regs(35, 32, [n for n in UREG[112:128]])
    bops = {0: ("SET", "{r} = {r} | d32;"), 1: ("CLR", "{r} = {r} & ~d32;"), 2: ("TGL", "{r} = {r} ^ d32;"),
            4: ("TST", "BTF = ({r} & d32) == d32;"), 5: ("XOR", "BTF = ({r} == d32);")}
    for code, (nm, sem) in bops.items():
        out.append(f'instr: BIT "{nm} "^{sreg}^" "^d32 is {f(47, 40)}=0x14 & {f(39, 37)}={code} & {sreg} & {a32hi} ; {lo16} '
                   f'[ d32 = ({a32hi} << 16) | {lo16}; ] {{ {sem.format(r=sreg)} }}')
    # Type 19 MODIFY/BITREV with data32 (Id = ...)
    for gg in (0, 1):
        isr = regs(34, 32, I2 if gg else I1, kind=f"m{gg}")
        dsub = []
        nm = f"IDST19_{gg}"
        for s in range(8):
            for x in range(8):
                src = (8 if gg else 0) + s
                dst = (8 if gg else 0) + (s ^ x)
                if x == 0:
                    dsub.append(f'{nm}: is {f(34, 32)}={s} & {f(37, 35)}=0 {{ export I{src}; }}')
                else:
                    dsub.append(f'{nm}: "I{dst} = " is {f(34, 32)}={s} & {f(37, 35)}={x} {{ export I{dst}; }}')
        out.append("\n".join(dsub))
        out.append(f'instr: MODIFY {nm}^"MODIFY("^{isr}^", "^d32s^")" is ({f(47, 40)}=0x16 & {f(39, 39)}=0 & {f(38, 38)}={gg} & {isr} & {nm} & {a32hi} ; {lo16}) '
                   f'[ d32s = ({a32hi} << 16) | {lo16}; ] {{ build {nm}; {nm} = {isr} + d32s; }}')
        out.append(f'instr: BITREV {nm}^"BITREV("^{isr}^", "^d32s^")" is ({f(47, 40)}=0x16 & {f(39, 39)}=1 & {f(38, 38)}={gg} & {isr} & {nm} & {a32hi} ; {lo16}) '
                   f'[ d32s = ({a32hi} << 16) | {lo16}; ] {{ build {nm}; local k:4 = d32s; {nm} = bitrev({isr}, k); }}')
    # Type 20 push/pop.  PUSH/POP LOOP use the modelled loop-counter stack; the status and
    # PC stacks and the cache flush remain user operations.
    names20 = ["PUSH LOOP", "POP LOOP", "PUSH STS", "POP STS", "PUSH PCSTK", "POP PCSTK", "FLUSH CACHE"]
    for v in range(128):
        txt = ", ".join(nm for k, nm in enumerate(names20) if v & (1 << (6 - k))) or "?20"
        mn, rest = (txt.split(" ", 1) + [""])[:2]
        sem = ""
        if v & 0x40:
            sem += "pushLoop(); CURLCNTR = LCNTR; "
        if v & 0x20:
            sem += "popLoop(); "
        if v & 0x1F or not v:
            sem += f"local k:4 = {v & 0x1F}; stackop(k);"
        out.append(f'instr: {mn} "{rest}" is {f(47, 40)}=0x17 & {f(39, 33)}={v} ; {lo16} {{ {sem} }}')
    # Types 21/22 NOP/IDLE and 16-bit forms
    for vm, extra in ((0, f" ; {lo16}"), (1, f" & {f(32, 32)}=0 ; {lo16}")):
        out.append(f'instr: NOP is visa={vm} & {f(47, 40)}=0x00 & {f(39, 38)}=0{extra} {{ }}')
        out.append(f'instr: IDLE is visa={vm} & {f(47, 40)}=0x00 & {f(39, 39)}=1{extra} {{ idle(); }}')
        out.append(f'instr: EMUIDLE is visa={vm} & {f(47, 40)}=0x00 & {f(39, 39)}=0 & {f(38, 38)}=1{extra} {{ emuidle(); }}')
    out.append(f'instr: NOP is visa=1 & {f(47, 40, tok="s16")}=0x00 & {f(39, 38, tok="s16")}=0 & {f(32, 32, tok="s16")}=1 {{ }}')
    out.append(f'instr: IDLE is visa=1 & {f(47, 40, tok="s16")}=0x00 & {f(39, 39, tok="s16")}=1 & {f(32, 32, tok="s16")}=1 {{ idle(); }}')
    # Type 25 CJUMP (C call: I6 = I7, R2 = old I6; the frame is stored in the delay slots)
    out.append(f'instr: CJUMP "("^ABS24^") (DB)" is ({f(47, 40)}=0x18 & {f(39, 32)}=0x04 & DS) ... & ABS24 '
               f'{{ R2 = I6; I6 = I7; build DS; call ABS24; }}')
    out.append(f'instr: CJUMP "("^REL24^") (DB)" is ({f(47, 40)}=0x18 & {f(39, 32)}=0x44 & DS) ... & REL24 '
               f'{{ R2 = I6; I6 = I7; build DS; call REL24; }}')
    out.append(f'instr: RFRAME is {f(47, 32)}=0x1900 ; {lo16} {{ I7 = I6; I6 = *[dm]:4 I6; }}')
    out.append(f'instr: RFRAME is visa=1 & {f(47, 32, tok="s16")}=0x1901 {{ I7 = I6; I6 = *[dm]:4 I6; }}')
    return [split_cond(o) for o in out if o]


def split_cond(block):
    """A conditional non-branch instruction exists once per condition code 0..30 (CCN, the
    body skipped when the condition is false) and once for TRUE with no test at all.  A
    single constructor testing a constant TRUE would leave a CBRANCH in every instruction,
    which the decompiler only folds late -- too late for jump-table recovery, whose guard
    search stops after two CBRANCHes."""
    out = []
    for ln in block.split("\n"):
        if "build CC; if (!CC) goto <skip>;" not in ln:
            out.append(ln)
            continue
        head, rest = ln.split(" is ", 1)
        pat, body = rest.split(" {", 1)
        out.append(head.replace("CC^", "CCN^", 1) + " is " + re.sub(r"\bCC\b", "CCN", pat) + " {" +
                   body.replace("build CC; if (!CC) goto <skip>;", "build CCN; if (!CCN) goto <skip>;"))
        body = body.replace("build CC; if (!CC) goto <skip>; ", "").replace(" <skip> }", " }")
        out.append(head.replace("CC^", "", 1) + " is " + re.sub(r"\bCC\b", f"{FL.f(37, 33)}=31", pat) +
                   " {" + body)
    return "\n".join(out)


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    parts = gen()
    # in a subtable a bare word in the display is an operand name: quote the mnemonics
    body = re.sub(r"^instr: ([A-Z0-9?]+) ", r'instr: "\1" ', "\n\n".join(parts), flags=re.M)
    title = "SHARC+ (ADSP-SC58x/2158x)" if PLUS else "ADSP-214xx SHARC"
    text = (f"# {title} (ISA + VISA) instruction tables -- GENERATED by tools/gen_sinc.py\n"
            "# from tools/sharc_isa.py; do not edit.  See sharc214xx.slaspec for the model.\n\n"
            + FL.render() + "\n\n" + body + "\n")
    out.write_text(text)
    if DEBUG:
        n = sum(1 for ln in text.splitlines() if ln.startswith("instr:"))
        print(f"[gen_sinc] {out}: {text.count(chr(10))} lines, {n} instr constructors", file=sys.stderr)


if __name__ == "__main__":
    main()
