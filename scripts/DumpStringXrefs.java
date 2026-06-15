// Ghidra post-script for STRIPPED firmware: for each needle in env NSM_STR (comma-sep),
// find it as an ASCII string in memory, list code refs, and decompile each referencing
// function. Also dumps functions whose body contains a given constant (env NSM_CONST, hex).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import ghidra.program.model.symbol.*;
import ghidra.program.model.scalar.Scalar;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*;
import java.util.*;

public class DumpStringXrefs extends GhidraScript {
    DecompInterface d;
    String out;
    Set<String> dumped = new HashSet<>();

    void dumpFunc(Function f, String why) throws Exception {
        if (f == null) return;
        String key = f.getEntryPoint().toString();
        if (!dumped.add(key)) return;
        String body;
        try { DecompileResults r = d.decompileFunction(f, 120, new ConsoleTaskMonitor());
            body = (r != null && r.decompileCompleted()) ? r.getDecompiledFunction().getC() : "// FAIL\n";
        } catch (Throwable t) { body = "// EXC " + t + "\n"; }
        PrintWriter pw = new PrintWriter(new File(out, "func_" + key + ".c"));
        pw.println("// func @ " + key + "   (" + why + ")"); pw.println(); pw.println(body); pw.close();
        println("[xref] " + key + "  " + why);
    }

    @Override public void run() throws Exception {
        out = System.getenv("NSM_OUT"); if (out == null) out = "/tmp/fw_out";
        new File(out).mkdirs();
        d = new DecompInterface(); d.toggleCCode(true); d.openProgram(currentProgram);
        Memory mem = currentProgram.getMemory();
        FunctionManager fm = currentProgram.getFunctionManager();
        ReferenceManager rm = currentProgram.getReferenceManager();

        String strs = System.getenv("NSM_STR");
        if (strs != null) for (String needleS : strs.split(",")) {
            String needle = needleS.trim(); if (needle.isEmpty()) continue;
            byte[] pat = needle.getBytes("ASCII");
            Address a = mem.findBytes(currentProgram.getMinAddress(), pat, null, true, new ConsoleTaskMonitor());
            while (a != null) {
                println("[str] \"" + needle + "\" @ " + a);
                ReferenceIterator ri = rm.getReferencesTo(a);
                int n=0;
                while (ri.hasNext()) { Reference r = ri.next();
                    dumpFunc(fm.getFunctionContaining(r.getFromAddress()), "ref \""+needle+"\" from "+r.getFromAddress()); n++; }
                // also scan for pointer-to-string constants in code (Ghidra may not auto-ref)
                if (n==0) println("   (no direct refs — may need pointer scan)");
                Address next = mem.findBytes(a.add(1), pat, null, true, new ConsoleTaskMonitor());
                a = next;
                if (dumped.size() > 60) break;
            }
        }

        String constEnv = System.getenv("NSM_CONST");
        if (constEnv != null) for (String cs : constEnv.split(",")) {
            cs = cs.trim(); if (cs.isEmpty()) continue;
            long target = Long.parseLong(cs.replace("0x",""), 16);
            FunctionIterator it = fm.getFunctions(true); int hits=0;
            while (it.hasNext() && hits < 25) {
                Function f = it.next();
                InstructionIterator ii = currentProgram.getListing().getInstructions(f.getBody(), true);
                boolean hit=false;
                while (ii.hasNext()) { Instruction ins = ii.next();
                    for (int oi=0; oi<ins.getNumOperands(); oi++) {
                        Object[] ops = ins.getOpObjects(oi);
                        for (Object o : ops) if (o instanceof Scalar && ((Scalar)o).getUnsignedValue()==target) { hit=true; }
                    }
                    if (hit) break;
                }
                if (hit) { dumpFunc(f, "const 0x"+Long.toHexString(target)); hits++; }
            }
        }
        println("[DumpStringXrefs] dumped " + dumped.size() + " funcs to " + out);
    }
}
