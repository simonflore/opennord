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
import ghidra.app.util.PseudoDisassembler;
import ghidra.app.util.importer.MessageLog;
import ghidra.program.model.address.Address;
import ghidra.program.model.address.AddressSetView;
import ghidra.program.model.lang.Register;
import ghidra.program.model.listing.*;
import ghidra.util.exception.CancelledException;
import ghidra.util.task.TaskMonitor;

/**
 * Gives every SHARC delayed branch in VISA code exactly two delay-slot instructions.
 * <p>
 * A {@code (DB)} branch executes the two instructions that follow it.  SLEIGH states a
 * delay slot as a byte count, and Ghidra collects delay-slot instructions until their
 * lengths reach it.  VISA instructions are 2, 4 or 6 bytes long, so no single count gives
 * two instructions: it has to be one more than the length of the first slot.  The SHARC
 * language takes that length from the context field {@code dslot} of the branch (0, 1, 2
 * for a 2, 4, 6 byte first slot; 0 by default).  This analyzer finds delayed branches
 * whose first slot is longer than {@code dslot} says, sets {@code dslot} and
 * re-disassembles the branch and its slots.
 */
public class SharcDelaySlotAnalyzer extends AbstractAnalyzer {

	private static final String NAME = "SHARC Delay Slot";
	private static final String DESCRIPTION =
		"Gives each (DB) branch in SHARC VISA code its two delay-slot instructions when " +
			"the first one is 32 or 48 bits long.";

	public SharcDelaySlotAnalyzer() {
		super(NAME, DESCRIPTION, AnalyzerType.INSTRUCTION_ANALYZER);
		setPriority(AnalysisPriority.DISASSEMBLY.after());
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
		Register dslot = program.getRegister("dslot");
		if (visa == null || dslot == null) {
			return false;
		}
		Listing listing = program.getListing();
		PseudoDisassembler pseudo = new PseudoDisassembler(program);
		List<Fix> fixes = new ArrayList<>();
		for (Instruction ins : listing.getInstructions(set, true)) {
			monitor.checkCancelled();
			if (ins.getPrototype().getDelaySlotByteCount() <= 0 || ins.isInDelaySlot() ||
				!isSet(ins.getValue(visa, false))) {
				continue;
			}
			Address slot1 = ins.getMaxAddress().next();
			int len1 = length(listing, pseudo, slot1);
			if (len1 != 2 && len1 != 4 && len1 != 6) {
				continue;
			}
			int want = len1 / 2 - 1;
			BigInteger have = ins.getValue(dslot, false);
			if (have != null && have.intValue() == want) {
				continue;
			}
			int len2 = length(listing, pseudo, slot1.add(len1));
			fixes.add(new Fix(ins.getMinAddress(), slot1.add(len1 + Math.max(len2, 0) - 1), want));
		}
		ProgramContext ctx = program.getProgramContext();
		for (Fix fix : fixes) {
			monitor.checkCancelled();
			try {
				listing.clearCodeUnits(fix.start, fix.end, false);
				ctx.setValue(dslot, fix.start, fix.start, BigInteger.valueOf(fix.dslot));
				new DisassembleCommand(fix.start, null, true).applyTo(program, monitor);
			}
			catch (ContextChangeException e) {
				log.appendMsg(NAME, "Could not set the delay slot of the branch at " +
					fix.start + ": " + e.getMessage());
			}
		}
		return true;
	}

	private static boolean isSet(BigInteger v) {
		return v != null && v.signum() != 0;
	}

	/** Length in bytes of the instruction at addr: the listing's, else a pseudo-decode. */
	private static int length(Listing listing, PseudoDisassembler pseudo, Address addr) {
		Instruction ins = listing.getInstructionAt(addr);
		if (ins != null) {
			return ins.getLength();
		}
		try {
			Instruction p = pseudo.disassemble(addr);
			return p == null ? -1 : p.getLength();
		}
		catch (Exception e) {
			return -1;
		}
	}

	private record Fix(Address start, Address end, int dslot) {
	}
}
