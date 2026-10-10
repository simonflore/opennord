/* ###
 * IP: GHIDRA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ghidra.app.plugin.core.analysis;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.services.*;
import ghidra.app.util.importer.MessageLog;
import ghidra.program.model.address.*;
import ghidra.program.model.lang.Register;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.MemoryAccessException;
import ghidra.util.exception.CancelledException;
import ghidra.util.task.TaskMonitor;

/**
 * Attaches the loop-back of a SHARC hardware loop to its last instruction when SLEIGH could
 * not.
 * <p>
 * {@code DO <end> UNTIL <term>} names the address of its loop's last instruction.  The
 * SLEIGH specification marks that instruction with context (lend, lterm, ltop) through a
 * {@code globalset} in the DO, and the root table adds the loop-back there.  The context is
 * only used if the last instruction is disassembled after the DO; one reached earlier by
 * another flow keeps its plain decoding.  This analyzer checks the last instruction of
 * every DO loop, and where its context is not the loop's, sets it and re-disassembles it.
 * <p>
 * In VISA code the last four instructions of a loop must be 48-bit instructions (SHARC
 * Processor Programming Reference, "VISA-Related Restrictions on Hardware Loops"), so the
 * end address is always the start of an instruction.  A loop whose end falls inside an
 * instruction, or lies before its DO, is reported and left alone.
 */
public class SharcLoopEndAnalyzer extends AbstractAnalyzer {

	private static final String NAME = "SHARC Loop End";
	private static final String DESCRIPTION =
		"Attaches the loop-back of SHARC DO ... UNTIL hardware loops to the loop's last " +
			"instruction when it was disassembled before its DO.";

	private static final int TERM_LCE = 15;

	public SharcLoopEndAnalyzer() {
		super(NAME, DESCRIPTION, AnalyzerType.INSTRUCTION_ANALYZER);
		setPriority(AnalysisPriority.DISASSEMBLY.after().after());
		setDefaultEnablement(true);
		setSupportsOneTimeAnalysis();
	}

	@Override
	public boolean canAnalyze(Program program) {
		return "SHARC".equals(program.getLanguage().getProcessor().toString());
	}

	@Override
	public boolean added(Program program, AddressSetView set, TaskMonitor monitor,
			MessageLog log) throws CancelledException {
		Register visa = program.getRegister("visa");
		Register lend = program.getRegister("lend");
		Register lterm = program.getRegister("lterm");
		Register ltop = program.getRegister("ltop");
		if (visa == null || lend == null || lterm == null || ltop == null) {
			return false;
		}
		Listing listing = program.getListing();
		List<Loop> loops = new ArrayList<>();
		for (Instruction ins : listing.getInstructions(set, true)) {
			monitor.checkCancelled();
			if (!ins.getMnemonicString().equals("DO") || ins.getLength() != 6) {
				continue;
			}
			try {
				Loop loop = decode(ins, isSet(ins.getValue(visa, false)));
				if (loop == null) {
					continue;
				}
				if (loop.end.compareTo(ins.getMaxAddress()) <= 0) {
					log.appendMsg(NAME, "Loop at " + ins.getMinAddress() + " ends at " + loop.end +
						", before its DO; not modelled");
					continue;
				}
				Instruction last = listing.getInstructionContaining(loop.end);
				if (last == null) {
					continue;		// the DO's globalset applies when it is disassembled
				}
				if (!last.getMinAddress().equals(loop.end)) {
					log.appendMsg(NAME, "Loop at " + ins.getMinAddress() + " ends inside the " +
						"instruction at " + last.getMinAddress() + "; not modelled");
					continue;
				}
				if (value(last, lend) == 1 && value(last, lterm) == loop.term &&
					value(last, ltop) == loop.top.getAddressableWordOffset()) {
					continue;
				}
				loops.add(loop);
			}
			catch (MemoryAccessException e) {
				log.appendMsg(NAME, "Could not read the DO at " + ins.getMinAddress());
			}
		}
		ProgramContext ctx = program.getProgramContext();
		for (Loop loop : loops) {
			monitor.checkCancelled();
			Instruction last = listing.getInstructionAt(loop.end);
			if (last == null) {
				continue;
			}
			Address start = last.getMinAddress();
			Address end = last.getMaxAddress();
			try {
				listing.clearCodeUnits(start, end, false);
				ctx.setValue(lend, start, start, BigInteger.ONE);
				ctx.setValue(lterm, start, start, BigInteger.valueOf(loop.term));
				ctx.setValue(ltop, start, start,
					BigInteger.valueOf(loop.top.getAddressableWordOffset()));
				new DisassembleCommand(start, new AddressSet(start, end), false).applyTo(program,
					monitor);
			}
			catch (ContextChangeException e) {
				log.appendMsg(NAME, "Could not mark the end of the loop at " + loop.end + ": " +
					e.getMessage());
			}
		}
		return true;
	}

	/**
	 * Decode a type 12/13 DO: opcode 0x0c/0x0d (counter loops, UNTIL LCE) or 0x0e (DO UNTIL
	 * term, the termination code in bits 37..33), and a 24-bit PC-relative end address in
	 * bits 23..0 -- in short words in VISA code, in 48-bit words in ISA code.
	 */
	private static Loop decode(Instruction ins, boolean isVisa) throws MemoryAccessException {
		boolean plus = isSharcPlus(ins.getProgram());
		byte[] b = ins.getBytes();
		int op = b[0] & 0xff;
		if (op != 0x0c && op != 0x0d && op != 0x0e) {
			return null;
		}
		int term = op == 0x0e ? (b[1] >> 1) & 0x1f : TERM_LCE;
		long off = ((b[3] & 0xffL) << 16) | ((b[4] & 0xffL) << 8) | (b[5] & 0xffL);
		// SHARC+ (types 12a/13a): bit 23 is the loop-mode bit and the offset is 23 bits
		off = plus ? ((off & 0x7fffffL) << 41) >> 41 : (off << 40) >> 40;
		AddressSpace space = ins.getMinAddress().getAddressSpace();
		long start = ins.getMinAddress().getAddressableWordOffset();
		long end = isVisa ? codeAddress(start + off, plus) : start + 3 * off;
		return new Loop(space.getTruncatedAddress(end, true),
			space.getTruncatedAddress(start + 3, true), term);
	}

	/**
	 * The code-space address of a PM address: short-word addresses as they are, 48-bit
	 * addresses of internal blocks 0-3 (0x80000-0xfffff) at their short-word alias,
	 * {@code 3*a - (a & 0xe0000)} -- the mapping the SLEIGH branch targets use.
	 */
	static long codeAddress(long a, boolean plus) {
		if (a >= 0x80000 && a < 0x100000) {
			// SHARC+ blocks start at 0x90000/0xb0000/0xc0000/0xe0000 (6 bytes per 48-bit word)
			return 3 * a - (a & (plus ? 0xf0000 : 0xe0000));
		}
		return a;
	}

	/** True for the SHARC+ (ADSP-SC58x/2158x) language, SHARC:BE:32:SHARCplus. */
	static boolean isSharcPlus(Program program) {
		return program.getLanguageID().getIdAsString().endsWith(":SHARCplus");
	}

	private static boolean isSet(BigInteger v) {
		return v != null && v.signum() != 0;
	}

	private static long value(Instruction ins, Register reg) {
		BigInteger v = ins.getValue(reg, false);
		return v == null ? -1 : v.longValue();
	}

	private record Loop(Address end, Address top, int term) {
	}
}
