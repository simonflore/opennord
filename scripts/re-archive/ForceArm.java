// Seed disassembly for a raw stripped THUMB-2 ARM image. Sets the TMode context to 1 over
// the whole image, then disassembles at every Thumb prologue: 16-bit PUSH{..,lr} (?? B5) and
// 32-bit PUSH.W {..,lr} (2D E9 .. ..), creates functions, runs incremental analysis.
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.lang.Register;
import ghidra.program.model.mem.Memory;
import java.math.BigInteger;

public class ForceArm extends GhidraScript {
    @Override public void run() throws Exception {
        Memory mem = currentProgram.getMemory();
        Address min = currentProgram.getMinAddress(), max = currentProgram.getMaxAddress();
        long start = min.getOffset(), end = max.getOffset();
        // Force Thumb mode across the whole image
        Register tmode = currentProgram.getRegister("TMode");
        if (tmode != null) {
            currentProgram.getProgramContext().setValue(tmode, min, max, BigInteger.ONE);
            println("[ForceArm] set TMode=1 over " + min + ".." + max);
        } else println("[ForceArm] no TMode register?!");

        int made = 0, tried = 0;
        try { disassemble(toAddr(8)); createFunction(toAddr(8), null); } catch (Exception e) {}
        for (long off = start; off + 4 <= end; off += 2) {   // halfword aligned
            Address a = toAddr(off);
            boolean prologue = false;
            try {
                int b0 = mem.getByte(a) & 0xff, b1 = mem.getByte(a.add(1)) & 0xff;
                // 16-bit PUSH {.., lr}: 0xB5xx  -> bytes [xx][B5]
                if (b1 == 0xB5) prologue = true;
                // 32-bit PUSH.W {.., lr}: halfword 0xE92D -> bytes [2D][E9]
                else if (b0 == 0x2D && b1 == 0xE9) prologue = true;
            } catch (Exception e) { continue; }
            if (!prologue) continue;
            tried++;
            try {
                if (getInstructionAt(a) == null) disassemble(a);
                if (getInstructionAt(a) != null && getFunctionAt(a) == null) { createFunction(a, null); made++; }
            } catch (Exception e) {}
            if ((off & 0x7FFFF) == 0) println("  swept 0x" + Long.toHexString(off) + " made=" + made);
        }
        println("[ForceArm] thumb prologues tried=" + tried + " functions made=" + made);
        analyzeChanges(currentProgram);
        println("[ForceArm] total functions = " + currentProgram.getFunctionManager().getFunctionCount());
    }
}
