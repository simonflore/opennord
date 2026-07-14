// Mode-aware prologue seeder for a stripped mixed ARM/Thumb raw image.
// Thumb prologues (16-bit PUSH {..,lr}=??B5 ; 32-bit PUSH.W=2D E9 ..) -> TMode=1.
// ARM prologues (STMFD sp!,{..,lr}=xx xx 2D E9, 4-aligned, cond AL) -> TMode=0, gap-fill only.
// Then incremental analysis to resolve literal-pool/MOVW-MOVT pointers and build xrefs.
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.lang.Register;
import ghidra.program.model.mem.Memory;
import java.math.BigInteger;

public class ForceArmMixed extends GhidraScript {
    Memory mem; Register tm;
    void seed(Address a, int tmode) {
        try {
            if (getInstructionAt(a) != null || getUndefinedDataAt(a) == null && getInstructionContaining(a) != null) return;
            currentProgram.getProgramContext().setValue(tm, a, a, BigInteger.valueOf(tmode));
            disassemble(a);
            if (getInstructionAt(a) != null && getFunctionAt(a) == null) createFunction(a, null);
        } catch (Exception e) {}
    }
    int b(Address a, int o) throws Exception { return mem.getByte(a.add(o)) & 0xff; }
    @Override public void run() throws Exception {
        mem = currentProgram.getMemory();
        tm = currentProgram.getRegister("TMode");
        long start = currentProgram.getMinAddress().getOffset(), end = currentProgram.getMaxAddress().getOffset();
        int thumb = 0, arm = 0;
        // Pass 1: Thumb prologues (halfword aligned)
        for (long off = start; off + 4 <= end; off += 2) {
            Address a = toAddr(off);
            try {
                int b0 = b(a,0), b1 = b(a,1);
                if (b1 == 0xB5 || (b0 == 0x2D && b1 == 0xE9)) { if (getInstructionContaining(a)==null){ seed(a, 1); thumb++; } }
            } catch (Exception e) {}
        }
        println("[mixed] thumb seeds=" + thumb);
        // Pass 2: ARM prologues (word aligned), gap-fill only
        for (long off = start; off + 4 <= end; off += 4) {
            Address a = toAddr(off);
            try {
                if (b(a,2) == 0x2D && b(a,3) == 0xE9 && getInstructionContaining(a) == null) { seed(a, 0); arm++; }
            } catch (Exception e) {}
        }
        println("[mixed] arm seeds=" + arm);
        println("[mixed] analyzing…");
        analyzeChanges(currentProgram);
        println("[mixed] total functions = " + currentProgram.getFunctionManager().getFunctionCount());
    }
}
