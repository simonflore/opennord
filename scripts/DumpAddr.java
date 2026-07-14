// Decompile specific functions by address (NSM_ADDRS = comma-separated hex).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.PrintWriter;

public class DumpAddr extends GhidraScript {
    @Override
    public void run() throws Exception {
        String out = System.getenv("NSM_OUT");
        if (out == null) out = "/tmp/nsm_addr";
        new File(out).mkdirs();
        String addrs = System.getenv("NSM_ADDRS");
        DecompInterface d = new DecompInterface();
        d.toggleCCode(true);
        d.openProgram(currentProgram);
        ConsoleTaskMonitor mon = new ConsoleTaskMonitor();
        for (String a : addrs.split(",")) {
            a = a.trim();
            if (a.isEmpty()) continue;
            Address addr = currentProgram.getAddressFactory().getAddress(a);
            Function f = getFunctionAt(addr);
            if (f == null) f = getFunctionContaining(addr);
            if (f == null) { println("no function at " + a); continue; }
            String body;
            try {
                DecompileResults res = d.decompileFunction(f, 300, mon);
                body = (res != null && res.decompileCompleted())
                    ? res.getDecompiledFunction().getC() : "// FAILED\n";
            } catch (Throwable t) { body = "// EXC " + t + "\n"; }
            PrintWriter pw = new PrintWriter(new File(out, a + ".c"));
            pw.println("// " + f.getName(true) + "  @ " + f.getEntryPoint());
            pw.println();
            pw.println(body);
            pw.close();
            println("[DumpAddr] " + a + " -> " + f.getName(true));
        }
    }
}
