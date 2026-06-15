// Ghidra post-script: list callers (functions with a call-ref) of each target function
// whose qualified name contains a token in env NSM_XREF (comma-sep).
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;
import ghidra.program.model.address.Address;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;

public class DumpXrefs extends GhidraScript {
    @Override
    public void run() throws Exception {
        String want = System.getenv("NSM_XREF");
        if (want == null) return;
        String[] toks = want.split(",");
        FunctionIterator it = currentProgram.getFunctionManager().getFunctions(true);
        while (it.hasNext()) {
            Function f = it.next();
            String qn = f.getName(true);
            boolean hit = false;
            for (String t : toks) if (!t.isEmpty() && qn.contains(t.trim())) { hit = true; break; }
            if (!hit) continue;
            Address ep = f.getEntryPoint();
            println("TARGET " + qn + " @ " + ep);
            ReferenceIterator ri = currentProgram.getReferenceManager().getReferencesTo(ep);
            int n = 0;
            while (ri.hasNext() && n < 40) {
                Reference r = ri.next();
                Function caller = currentProgram.getFunctionManager().getFunctionContaining(r.getFromAddress());
                println("   <- " + (caller != null ? caller.getName(true) : "?") + " @ " + r.getFromAddress() + " (" + r.getReferenceType() + ")");
                n++;
            }
            if (n == 0) println("   <- (no refs)");
        }
    }
}
