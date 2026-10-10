// Smoke test for tests/smoke.sh.  Prints the memory blocks the loader made,
// disassembles in address order and prints one line per instruction, then
// prints the analyzers whose class name starts with the prefix given as the
// first script argument.  Further arguments are start/end address pairs to
// disassemble; without them every initialized executable block is.
// smoke.sh compares the output with the case's expected.txt.
//@category Test
import java.util.ArrayList;
import java.util.List;

import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.script.GhidraScript;
import ghidra.app.services.Analyzer;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.mem.MemoryBlock;
import ghidra.program.model.pcode.PcodeOp;
import ghidra.util.classfinder.ClassSearcher;

public class SmokeTest extends GhidraScript {

	@Override
	protected void run() throws Exception {
		String[] args = getScriptArgs();
		String prefix = args.length > 0 ? args[0].toLowerCase() : "";

		List<AddressRange> ranges = new ArrayList<>();
		for (MemoryBlock block : currentProgram.getMemory().getBlocks()) {
			println("SMOKE block " + block.getName() + " " + block.getStart() + "-" +
				block.getEnd() + " " + (block.isInitialized() ? "init " : "uninit ") +
				(block.isRead() ? "r" : "-") + (block.isWrite() ? "w" : "-") +
				(block.isExecute() ? "x" : "-"));
			if (args.length <= 1 && block.isInitialized() && block.isExecute()) {
				ranges.add(new AddressRangeImpl(block.getStart(), block.getEnd()));
			}
		}
		for (int i = 1; i + 1 < args.length; i += 2) {
			ranges.add(new AddressRangeImpl(toAddr(args[i]), toAddr(args[i + 1])));
		}

		for (AddressRange r : ranges) {
			AddressSet range = new AddressSet(r);
			Address addr = r.getMinAddress();
			while (addr != null && addr.compareTo(r.getMaxAddress()) <= 0) {
				Instruction insn = getInstructionAt(addr);
				if (insn == null) {
					new DisassembleCommand(new AddressSet(addr), range, false)
							.applyTo(currentProgram, monitor);
					insn = getInstructionAt(addr);
				}
				if (insn == null) {
					println("SMOKE " + addr + " ??");
					addr = addr.next();
					continue;
				}
				PcodeOp[] pcode = insn.getPcode();
				println("SMOKE " + addr + " " + insn + (pcode.length == 0 ? "  (no p-code)" : ""));
				addr = insn.getMaxAddress().next();
			}
		}

		List<Analyzer> analyzers = ClassSearcher.getInstances(Analyzer.class);
		analyzers.stream()
				.filter(a -> a.getClass().getSimpleName().toLowerCase().startsWith(prefix))
				.filter(a -> a.canAnalyze(currentProgram))
				.map(Analyzer::getName)
				.sorted()
				.forEach(name -> println("SMOKE analyzer " + name));
	}
}
