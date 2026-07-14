// Ghidra post-script: decompile the Nord Sample (.nsmp) codec + section readers.
// Targets Ymer::Codec sample-decode path so the .nsmp chunk grammar and the
// CSmpDecode algorithm can be ported (interop RE; docs/NSMP-CODEC.md, LEGAL.md).
// Output dir from env NSM_OUT (default /tmp/nse_decomp). Matches on bare tokens
// so it works whether names are demangled or still mangled.
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

public class DumpNsmpCodec extends GhidraScript {
    static final String[] WANT = {
        "CSmpDecode", "CSmpEncode", "CSmpStreamBridge",
        "DecodeStroke", "EncodeStroke", "Bridge_Read", "Bridge_GetProps", "Populate",
        "CSectionNSMP", "CSectionMap", "CSectionStroke", "CSectionMeta",
        "CSectionCategory", "CBlockHdr", "ProbeCodec", "ProbeFormat", "PeekFormat",
        "CBinInputNordFile", "CDecodeBundle", "CPeekBundle",
    };
    static final String[] SKIP = {
        "operator", "__cxx", "wxEvent", "sort", "insertion", "::~",
    };

    @Override
    public void run() throws Exception {
        String out = System.getenv("NSM_OUT");
        if (out == null) out = "/tmp/nse_decomp";
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
                DecompileResults res = d.decompileFunction(f, 180, mon);
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
        println("[DumpNsmpCodec] wrote " + count + " functions to " + out);
    }
}
