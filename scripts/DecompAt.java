// Decompile the function containing each VA in env NSM_AT (comma-sep hex). If no function is
// defined there, walk backwards to the nearest defined function (literal pools follow their
// consuming code). Also tries to disassemble (both modes) if the area is raw.
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.*;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*;

public class DecompAt extends GhidraScript {
    @Override public void run() throws Exception {
        String out = System.getenv("NSM_OUT"); if (out==null) out="/tmp/fw_at"; new File(out).mkdirs();
        DecompInterface d = new DecompInterface(); d.toggleCCode(true); d.openProgram(currentProgram);
        FunctionManager fm = currentProgram.getFunctionManager();
        for (String s : System.getenv("NSM_AT").split(",")) {
            s=s.trim(); if(s.isEmpty()) continue;
            long va=Long.parseLong(s.replace("0x",""),16);
            Address a=toAddr(va);
            Function f=fm.getFunctionContaining(a);
            if (f==null) {
                // walk back up to 0x3000 bytes for a containing function
                for (long off=0; off<0x3000 && f==null; off+=2) { f=fm.getFunctionContaining(a.subtract(off)); }
            }
            if (f==null) { println("[at] 0x"+Long.toHexString(va)+": NO function found nearby"); continue; }
            String body;
            try { DecompileResults r=d.decompileFunction(f,120,new ConsoleTaskMonitor());
                body=(r!=null&&r.decompileCompleted())?r.getDecompiledFunction().getC():"// FAIL\n";
            } catch(Throwable t){ body="// EXC "+t+"\n"; }
            String ep=f.getEntryPoint().toString();
            PrintWriter pw=new PrintWriter(new File(out,"at_"+s.replace("0x","")+"_fn_"+ep+".c"));
            pw.println("// target VA 0x"+Long.toHexString(va)+"  -> function @ "+ep); pw.println(); pw.println(body); pw.close();
            println("[at] 0x"+Long.toHexString(va)+" -> func @ "+ep+" ("+f.getBody().getNumAddresses()+" bytes)");
        }
    }
}
