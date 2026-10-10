// Report analysis coverage and every "Bad Instruction" error bookmark with its raw parcels.
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import java.util.*;
public class AnalysisReport extends GhidraScript {
  @Override public void run() throws Exception {
    Listing l=currentProgram.getListing();
    println("[rep] functions="+currentProgram.getFunctionManager().getFunctionCount()+
            " instructions="+l.getNumInstructions());
    Map<String,Integer> byHead=new TreeMap<>(); int n=0;
    for (Bookmark b: (Iterable<Bookmark>)() -> currentProgram.getBookmarkManager().getBookmarksIterator("Error")) {
      Address a=b.getAddress(); n++;
      StringBuilder hx=new StringBuilder();
      for (int i=0;i<6;i++) { try { hx.append(String.format("%02x",currentProgram.getMemory().getByte(a.add(i))&0xff)); } catch(Exception e){} }
      byHead.merge(hx.substring(0,Math.min(2,hx.length())),1,Integer::sum);
      if (n<=40) println("[rep] bad "+a+" "+hx+" "+b.getComment());
    }
    println("[rep] error bookmarks="+n+" by first byte="+byHead);
  }
}
