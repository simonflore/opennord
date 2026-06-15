// Pre-script: enable aggressive instruction finding so Ghidra's auto-analysis disassembles
// BOTH ARM and Thumb code at correct alignment (proper recursive mixed-mode analysis for a
// stripped raw firmware image). Run as -preScript before the import-triggered analysis.
import ghidra.app.script.GhidraScript;

public class ProperPass extends GhidraScript {
    @Override public void run() throws Exception {
        String[] opts = {
            "ARM Aggressive Instruction Finder",
            "Aggressive Instruction Finder",
            "ARM Symbol",
        };
        for (String o : opts) {
            try { setAnalysisOption(currentProgram, o, "true"); println("[ProperPass] enabled: " + o); }
            catch (Throwable t) { println("[ProperPass] could not set " + o + ": " + t); }
        }
    }
}
