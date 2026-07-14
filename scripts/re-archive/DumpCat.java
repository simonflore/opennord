import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;

public class DumpCat extends GhidraScript {
  public void run() throws Exception {
    long base = 0x1007980bcL;
    Address baseA = currentProgram.getAddressFactory().getAddress(Long.toHexString(base));
    for (int i = 0; i < 54; i++) {
      int off = getInt(baseA.add((long) i * 4));   // relative offset table
      Address strA = baseA.add((long) off);
      StringBuilder sb = new StringBuilder();
      Address a = strA;
      for (int k = 0; k < 40; k++) {
        byte b = getByte(a);
        if (b == 0) break;
        sb.append((char) (b & 0xff));
        a = a.add(1);
      }
      println("cat " + i + " = " + sb);
    }
  }
}
