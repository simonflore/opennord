// Ghidra Java post-script: decompile Ymer::Codec::NW1 section readers + primitives.
// Matches on bare tokens so it works whether names are demangled or still mangled
// (the mangled symbol contains e.g. "CSectionProgram" as a substring too).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;
import ghidra.program.model.listing.FunctionManager;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.PrintWriter;
import java.util.HashSet;
import java.util.Set;

public class DumpSections extends GhidraScript {
    static final String[] WANT = {
        "CSectionProgram", "CSectionPreset", "CSectionCommon", "CSectionMap",
        "CSectionNSMP", "CSectionMeta", "CSectionCategory", "CSectionStroke",
        "CSectionBase", "CSectionIterator", "PeekFormat", "ProbeFormat",
        "CScopedSectionReader", "CBlockHdr", "ProbeCodec", "S_ReadNameStr",
        "GetU8", "GetU16", "GetU24", "GetU32", "GetS32",
    };
    static final String[] SKIP = {
        "sort", "insertion", "ClassicAlg", "wxEvent", "operator", "__cxx",
    };

    @Override
    public void run() throws Exception {
        String out = System.getenv("NSM_OUT");
        if (out == null) out = "/tmp/nsm_decomp";
        new File(out).mkdirs();

        DecompInterface d = new DecompInterface();
        d.toggleCCode(true);
        d.openProgram(currentProgram);
        ConsoleTaskMonitor mon = new ConsoleTaskMonitor();
        FunctionManager fm = currentProgram.getFunctionManager();
        FunctionIterator it = fm.getFunctions(true);

        StringBuilder idx = new StringBuilder();
        Set<String> seen = new HashSet<String>();
        int count = 0;
        while (it.hasNext()) {
            Function f = it.next();
            String qn = f.getName(true);
            boolean want = false;
            for (String w : WANT) if (qn.contains(w)) { want = true; break; }
            if (!want) continue;
            boolean skip = false;
            for (String s : SKIP) if (qn.contains(s)) { skip = true; break; }
            if (skip) continue;
            String ep = f.getEntryPoint().toString();
            if (!seen.add(ep)) continue;

            String body;
            try {
                DecompileResults res = d.decompileFunction(f, 120, mon);
                if (res == null || !res.decompileCompleted())
                    body = "// DECOMPILE FAILED: " + qn + "\n";
                else
                    body = res.getDecompiledFunction().getC();
            } catch (Throwable t) {
                body = "// DECOMPILE EXCEPTION: " + qn + " : " + t + "\n";
            }

            String shortn = qn.split("\\(")[0]
                .replace("Ymer::Codec::", "")
                .replaceAll("[^A-Za-z0-9_:-]", "_")
                .replace("::", "__");
            if (shortn.length() > 80) shortn = shortn.substring(0, 80);
            File fn = new File(out, shortn + "@" + ep + ".c");
            PrintWriter pw = new PrintWriter(fn);
            pw.println("// " + qn + "  @ " + ep);
            pw.println();
            pw.println(body);
            pw.close();
            idx.append(ep).append("  ").append(qn).append("\n");
            count++;
        }
        PrintWriter pw = new PrintWriter(new File(out, "INDEX.txt"));
        pw.println("decompiled " + count + " functions");
        pw.println();
        pw.print(idx.toString());
        pw.close();
        println("[DumpSections] wrote " + count + " functions to " + out);
    }
}
