// Ghidra post-script: decompile every function whose qualified name contains any
// comma-separated token in env NSM_WANT. Output dir from NSM_OUT (default
// /tmp/nse_name). For interop RE of the .nsmp codec (docs/NSMP-CODEC.md).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.PrintWriter;

public class DumpName extends GhidraScript {
    @Override
    public void run() throws Exception {
        String out = System.getenv("NSM_OUT");
        if (out == null) out = "/tmp/nse_name";
        new File(out).mkdirs();
        String wantEnv = System.getenv("NSM_WANT");
        if (wantEnv == null) wantEnv = "FilterSamples";
        String[] want = wantEnv.split(",");

        DecompInterface d = new DecompInterface();
        d.toggleCCode(true);
        d.openProgram(currentProgram);
        ConsoleTaskMonitor mon = new ConsoleTaskMonitor();
        FunctionIterator it = currentProgram.getFunctionManager().getFunctions(true);
        int count = 0;
        while (it.hasNext()) {
            Function f = it.next();
            String qn = f.getName(true);
            boolean hit = false;
            for (String w : want) if (!w.isEmpty() && qn.contains(w.trim())) { hit = true; break; }
            if (!hit) continue;
            String ep = f.getEntryPoint().toString();
            String body;
            try {
                DecompileResults res = d.decompileFunction(f, 180, mon);
                body = (res != null && res.decompileCompleted())
                    ? res.getDecompiledFunction().getC() : "// FAILED: " + qn + "\n";
            } catch (Throwable t) { body = "// EXC " + t + "\n"; }
            String shortn = qn.split("\\(")[0].replaceAll("[^A-Za-z0-9_:-]", "_").replace("::", "__");
            if (shortn.length() > 80) shortn = shortn.substring(0, 80);
            PrintWriter pw = new PrintWriter(new File(out, shortn + "@" + ep + ".c"));
            pw.println("// " + qn + "  @ " + ep);
            pw.println();
            pw.println(body);
            pw.close();
            println("[DumpName] " + ep + " -> " + qn);
            count++;
        }
        println("[DumpName] wrote " + count + " functions to " + out);
    }
}
