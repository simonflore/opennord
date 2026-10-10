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

import java.util.Set;
import java.util.TreeSet;

import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.cmd.function.CreateFunctionCmd;
import ghidra.app.services.*;
import ghidra.app.util.importer.MessageLog;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.RefType;
import ghidra.program.model.symbol.Reference;
import ghidra.util.exception.CancelledException;
import ghidra.util.task.TaskMonitor;

/**
 * Creates functions at code addresses passed as call arguments on the SHARC.
 * <p>
 * Interrupt handlers and other callbacks are commonly reached only through a pointer that
 * is loaded into an argument register and passed to a registration routine -- for
 * example the C run time's {@code interrupt(signal, handler)}.  Constant propagation finds
 * those values and records PARAM references to them, but nothing else makes the target a
 * function, so it is never decompiled.  This analyzer runs after constant propagation and
 * creates a function at the target of every PARAM reference into the code space that is
 * not already inside a function.
 */
public class SharcFunctionPointerAnalyzer extends AbstractAnalyzer {

	private static final String NAME = "SHARC Function Pointer Arguments";
	private static final String DESCRIPTION =
		"Creates functions at code addresses that constant propagation finds passed as " +
			"call arguments (callbacks, interrupt handlers).";

	public SharcFunctionPointerAnalyzer() {
		super(NAME, DESCRIPTION, AnalyzerType.INSTRUCTION_ANALYZER);
		// after the Basic Constant Reference Analyzer (REFERENCE_ANALYSIS - 4)
		setPriority(AnalysisPriority.REFERENCE_ANALYSIS.before());
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
		AddressSpace code = program.getAddressFactory().getDefaultAddressSpace();
		Listing listing = program.getListing();
		FunctionManager functions = program.getFunctionManager();
		Set<Address> targets = new TreeSet<>();
		for (Instruction ins : listing.getInstructions(set, true)) {
			monitor.checkCancelled();
			for (Reference ref : ins.getReferencesFrom()) {
				Address to = ref.getToAddress();
				if (ref.getReferenceType() == RefType.PARAM && to.getAddressSpace() == code &&
					program.getMemory().contains(to) && functions.getFunctionContaining(to) == null) {
					targets.add(to);
				}
			}
		}
		for (Address to : targets) {
			monitor.checkCancelled();
			if (listing.getInstructionAt(to) == null) {
				if (listing.getCodeUnitContaining(to) instanceof Instruction) {
					continue;		// inside another instruction: not a function start
				}
				new DisassembleCommand(to, null, true).applyTo(program, monitor);
				if (listing.getInstructionAt(to) == null) {
					continue;
				}
			}
			new CreateFunctionCmd(to).applyTo(program, monitor);
		}
		return true;
	}
}
