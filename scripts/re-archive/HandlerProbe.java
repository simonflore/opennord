// Force-ARM-disassemble specific target VAs (env NSM_AT, comma hex), create functions, decompile.
// For chasing format-handler pointers in a region that is ARM-mode (not Thumb).
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.address.Address;
import ghidra.program.model.lang.Register;
import ghidra.program.model.listing.*;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*; import java.math.BigInteger;

public class HandlerProbe extends GhidraScript {
    @Override public void run() throws Exception {
        String out=System.getenv("NSM_OUT"); if(out==null) out="/tmp/fw_h"; new File(out).mkdirs();
        DecompInterface d=new DecompInterface(); d.toggleCCode(true); d.openProgram(currentProgram);
        Register tm=currentProgram.getRegister("TMode");
        for (String s: System.getenv("NSM_AT").split(",")) {
            s=s.trim(); if(s.isEmpty()) continue;
            long va=Long.parseLong(s.replace("0x",""),16); Address a=toAddr(va);
            try { currentProgram.getProgramContext().setValue(tm,a,a,BigInteger.ZERO); } catch(Exception e){}
            try { if(getInstructionAt(a)==null) disassemble(a); } catch(Exception e){}
            Function f=getFunctionAt(a);
            if(f==null){ try{ f=createFunction(a,null);}catch(Exception e){} }
            if(f==null){ println("[h] 0x"+Long.toHexString(va)+": could not form function"); continue; }
            String body; try{ DecompileResults r=d.decompileFunction(f,120,new ConsoleTaskMonitor());
                body=(r!=null&&r.decompileCompleted())?r.getDecompiledFunction().getC():"// FAIL\n";
            }catch(Throwable t){ body="// EXC "+t+"\n"; }
            PrintWriter pw=new PrintWriter(new File(out,"h_"+s.replace("0x","")+".c")); pw.println("// "+s); pw.println(); pw.println(body); pw.close();
            boolean magic = body.contains("0x50534e43")||body.contains("0x6e706e6f")||body.contains("0x6f6e706e")||body.contains("fe94")||body.contains("CNSP");
            println("[h] 0x"+Long.toHexString(va)+" -> func @ "+f.getEntryPoint()+"  bytes="+f.getBody().getNumAddresses()+(magic?"  *** MAGIC/REGISTRY ref ***":""));
        }
    }
}
