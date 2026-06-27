// Decompile every function; save those whose C text contains any comma-sep substring in
// env NSM_GREP. Correct technique for stripped Thumb-2 where 32-bit magics are built via
// MOVW/MOVT (invisible to byte search but reconstructed by the decompiler).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*;

public class GrepDecomp extends GhidraScript {
    @Override public void run() throws Exception {
        String out = System.getenv("NSM_OUT"); if (out == null) out = "/tmp/fw_grep";
        new File(out).mkdirs();
        String[] needles = System.getenv("NSM_GREP").split(",");
        DecompInterface d = new DecompInterface(); d.toggleCCode(true); d.openProgram(currentProgram);
        ConsoleTaskMonitor mon = new ConsoleTaskMonitor();
        FunctionIterator it = currentProgram.getFunctionManager().getFunctions(true);
        int n=0, hit=0;
        while (it.hasNext()) {
            Function f = it.next(); n++;
            String c;
            try { DecompileResults r = d.decompileFunction(f, 45, mon);
                if (r==null || !r.decompileCompleted()) continue;
                c = r.getDecompiledFunction().getC();
            } catch (Throwable t) { continue; }
            String why=null;
            for (String ndl : needles) { String s=ndl.trim(); if(!s.isEmpty() && c.contains(s)){why=s;break;} }
            if (why==null) continue;
            String ep=f.getEntryPoint().toString();
            PrintWriter pw=new PrintWriter(new File(out,"f_"+ep+".c"));
            pw.println("// func @ "+ep+"  matched: "+why); pw.println(); pw.println(c); pw.close();
            println("[hit] "+ep+"  matched "+why); hit++;
        }
        println("[GrepDecomp] scanned "+n+" funcs, "+hit+" hits -> "+out);
    }
}
