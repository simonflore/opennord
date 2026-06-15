// Ghidra post-script: print the 4-byte LE int at each VA in env NSM_ADDRS (comma-sep hex).
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;

public class DumpData extends GhidraScript {
    @Override
    public void run() throws Exception {
        String env = System.getenv("NSM_ADDRS");
        if (env == null) return;
        for (String s : env.split(",")) {
            s = s.trim(); if (s.isEmpty()) continue;
            long va = Long.parseLong(s.replace("0x", ""), 16);
            Address a = currentProgram.getAddressFactory().getDefaultAddressSpace().getAddress(va);
            try {
                int v = getInt(a);
                StringBuilder asc = new StringBuilder();
                for (int i = 0; i < 4; i++) { int by = (v >> (8*i)) & 0xff; asc.append(by >= 32 && by < 127 ? (char) by : '.'); }
                println(String.format("0x%x = 0x%08x  LEbytes='%s'", va, v, asc.toString()));
            } catch (Exception e) { println("0x" + Long.toHexString(va) + " ERR " + e); }
        }
    }
}
