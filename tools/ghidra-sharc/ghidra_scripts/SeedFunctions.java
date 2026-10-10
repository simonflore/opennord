// Seed SHARC+ function starts from (1) CALL targets found by a linear VISA sweep of the
// initialized code memory and (2) dm words holding a code address that decodes. Then
// re-run auto-analysis so flow, delay slots and loops are recovered from those seeds.
import ghidra.app.script.GhidraScript;
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.PseudoInstruction;
import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import ghidra.program.model.symbol.*;
import java.util.*;
public class SeedFunctions extends GhidraScript {
  @Override public void run() throws Exception {
    AddressSpace sw=currentProgram.getAddressFactory().getDefaultAddressSpace();
    AddressSpace dm=currentProgram.getAddressFactory().getAddressSpace("dm");
    Memory mem=currentProgram.getMemory();
    PseudoDisassembler pd=new PseudoDisassembler(currentProgram);
    Set<Address> seeds=new TreeSet<>();
    // (1) linear sweep for call targets over non-zero code memory
    Address CODE_LO=sw.getTruncatedAddress(0x120000L,true), CODE_HI=sw.getTruncatedAddress(0x140000L,true);
    Set<Address> jumps=new TreeSet<>();
    Set<Address> after=new TreeSet<>();
    {
      Address a=CODE_LO, end=CODE_HI;
      while (a.compareTo(end)<0) {
        if ((mem.getShort(a)&0xffff)==0) { a=a.add(2); continue; }
        PseudoInstruction ins=null; try { ins=pd.disassemble(a);} catch(Exception e){}
        if (ins==null) { a=a.add(2); continue; }
        if (ins.getFlowType().isTerminal()) {
          // function boundary: skip the delay slots of a (DB) return, then the next
          // non-NOP instruction is a candidate function start
          Address n=a.add(ins.getLength());
          int slots=ins.getDelaySlotDepth();
          for (int k=0;k<slots;k++) { PseudoInstruction d=null; try { d=pd.disassemble(n);} catch(Exception e){} if (d==null) break; n=n.add(d.getLength()); }
          for (int k=0;k<4 && n.compareTo(CODE_HI)<0;k++) {
            PseudoInstruction q=null; try { q=pd.disassemble(n);} catch(Exception e){}
            if (q==null || (mem.getShort(n)&0xffff)==0) break;
            if (!q.getMnemonicString().equals("NOP")) { after.add(n); break; }
            n=n.add(q.getLength());
          }
        }
        for (Address t: ins.getFlows()) {
          if (t.getAddressSpace()!=sw || !mem.contains(t) || t.compareTo(CODE_LO)<0 || t.compareTo(CODE_HI)>=0) continue;
          if (ins.getFlowType().isCall()) seeds.add(t); else jumps.add(t);
        }
        a=a.add(ins.getLength());
      }
    }
    int calls=seeds.size();
    // (2) dm words that are code addresses
    long lo=0x120000L, hi=0x140000L;
    for (MemoryBlock blk: mem.getBlocks()) {
      if (blk.getStart().getAddressSpace()!=dm) continue;
      for (Address a=blk.getStart(); a.compareTo(blk.getEnd())<0; a=a.add(4)) {
        long v=mem.getInt(a)&0xffffffffL;
        if (v<lo || v>=hi) continue;
        Address t=sw.getTruncatedAddress(v,true);
        if (!mem.contains(t) || (mem.getShort(t)&0xffff)==0) continue;
        PseudoInstruction ins=null; try { ins=pd.disassemble(t);} catch(Exception e){}
        if (ins!=null) seeds.add(t);
      }
    }
    println("[seed] call targets="+calls+" plus data pointers="+(seeds.size()-calls));
    for (Address t: jumps) if (getInstructionAt(t)==null) new DisassembleCommand(t,null,true).applyTo(currentProgram,monitor);
    println("[seed] jump targets="+jumps.size()+" after-return starts="+after.size());
    if (!"0".equals(System.getenv("SEED_AFTER_RET"))) seeds.addAll(after);
    for (Address t: seeds) {
      if (getInstructionAt(t)==null) new DisassembleCommand(t,null,true).applyTo(currentProgram,monitor);
      if (getFunctionAt(t)==null) createFunction(t,null);
    }
    analyzeChanges(currentProgram);
    // coverage of block 0: non-zero short words inside instructions
    long nz=0, cov=0;
    for (Address a=CODE_LO; a.compareTo(CODE_HI)<0; a=a.add(2)) {
      if (!mem.contains(a) || (mem.getShort(a)&0xffff)==0) continue;
      nz++; if (currentProgram.getListing().getInstructionContaining(a)!=null) cov++;
    }
    println(String.format("[seed] block0 coverage: %d of %d non-zero short words in instructions (%.1f%%)",cov,nz,100.0*cov/Math.max(nz,1)));
  }
}
