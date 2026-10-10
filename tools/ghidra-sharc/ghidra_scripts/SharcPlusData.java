// Pre/post-script: add the SHARC+ data image (env SHARCPLUS_DM) as an initialized dm block at
// normal-word 0x90000, so data references resolve.
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.*;
import ghidra.program.model.mem.*;
import java.io.*;
import java.nio.file.*;
public class SharcPlusData extends GhidraScript {
  @Override public void run() throws Exception {
    String p=System.getenv("SHARCPLUS_DM"); if (p==null) { println("[dm] SHARCPLUS_DM not set"); return; }
    byte[] b=Files.readAllBytes(Paths.get(p));
    AddressSpace dm=currentProgram.getAddressFactory().getAddressSpace("dm");
    Address a=dm.getTruncatedAddress(0x90000L,true);
    Memory m=currentProgram.getMemory();
    if (m.getBlock(a)!=null) { println("[dm] already present"); return; }
    m.createInitializedBlock("L1_dm",a,new ByteArrayInputStream(b),b.length,monitor,false);
    println("[dm] added "+b.length+" bytes at "+a);
  }
}
