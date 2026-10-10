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

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.services.*;
import ghidra.app.util.importer.MessageLog;
import ghidra.program.model.address.Address;
import ghidra.program.model.address.AddressSetView;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.FlowType;
import ghidra.util.exception.CancelledException;
import ghidra.util.task.TaskMonitor;

/**
 * Turns the SHARC C compiler's calls through a delayed JUMP into calls.
 * <p>
 * Besides CJUMP, VisualDSP++ and CrossCore Embedded Studio call functions with an ordinary
 * delayed jump -- direct, {@code JUMP (<addr>) (DB)}, or indirect, {@code JUMP (M13, I12)
 * (DB)} -- and push the return address onto the C stack in a delay slot:
 * {@code DM(I7, M7) = PC} in 48-bit code, or {@code DM(I7, M7) = <return address - 1>} in
 * VISA code, where the PC of a slot is not the return address.  The callee returns through
 * {@code JUMP (M14, I12) (DB)} with the saved address plus one.  This analyzer finds
 * delayed jumps with such a store in a delay slot and overrides their flow to CALL, so the
 * code after the delay slots is disassembled and the target becomes a function.
 */
public class SharcCallIdiomAnalyzer extends AbstractAnalyzer {

	private static final String NAME = "SHARC Call Idiom";
	private static final String DESCRIPTION =
		"Marks delayed jumps that push their return address in a delay slot (C calls " +
			"through JUMP (DB)) as calls.";

	private static final Pattern PUSH =
		Pattern.compile("DM\\(I7,M7\\)=(PC|(-?0x[0-9a-fA-F]+))$");

	public SharcCallIdiomAnalyzer() {
		super(NAME, DESCRIPTION, AnalyzerType.INSTRUCTION_ANALYZER);
		// after the SHARC Delay Slot analyzer has given every branch its two slots
		setPriority(AnalysisPriority.DISASSEMBLY.after().after().after());
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
		Listing listing = program.getListing();
		List<Instruction> calls = new ArrayList<>();
		for (Instruction ins : listing.getInstructions(set, true)) {
			monitor.checkCancelled();
			if (ins.isInDelaySlot() || ins.getPrototype().getDelaySlotByteCount() <= 0 ||
				ins.getFlowOverride() != FlowOverride.NONE) {
				continue;
			}
			FlowType flow = ins.getFlowType();
			if (!flow.isJump() || flow.isCall() || flow.isTerminal()) {
				continue;
			}
			Instruction s1 = listing.getInstructionAt(ins.getMaxAddress().next());
			Instruction s2 = s1 == null ? null : listing.getInstructionAt(s1.getMaxAddress().next());
			if (s1 == null || s2 == null || !s2.isInDelaySlot()) {
				continue;
			}
			long ret = s2.getMaxAddress().next().getAddressableWordOffset();
			if (pushesReturn(s1, ret) || pushesReturn(s2, ret)) {
				calls.add(ins);
			}
		}
		for (Instruction ins : calls) {
			monitor.checkCancelled();
			ins.setFlowOverride(FlowOverride.CALL);
			Address fall = ins.getFallThrough();
			if (fall != null && listing.getInstructionAt(fall) == null) {
				new DisassembleCommand(fall, null, true).applyTo(program, monitor);
			}
		}
		return true;
	}

	/** Does the delay-slot instruction push the return address {@code ret} (word offset)? */
	private static boolean pushesReturn(Instruction slot, long ret) {
		String text = slot.toString().replace(" ", "");
		Matcher m = PUSH.matcher(text);
		if (!m.find()) {
			return false;
		}
		if (m.group(1).equals("PC")) {
			return true;
		}
		try {
			return Long.decode(m.group(2)) == ret - 1;
		}
		catch (NumberFormatException e) {
			return false;
		}
	}
}
