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
package ghidra.app.util.opinion;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.*;
import java.util.zip.DataFormatException;
import java.util.zip.Inflater;

import ghidra.app.util.MemoryBlockUtils;
import ghidra.app.util.bin.ByteProvider;
import ghidra.app.util.importer.MessageLog;
import ghidra.program.model.address.*;
import ghidra.program.model.lang.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import ghidra.util.exception.CancelledException;
import ghidra.util.task.TaskMonitor;

/**
 * Loads an Analog Devices SHARC ADSP-214xx boot stream: a loader (.ldr) file of
 * tag/count/address blocks, optionally preceded by the 256-instruction boot kernel, as
 * described in the VisualDSP++ Loader and Utilities Manual (rev 2.5), chapter 6 "ADSP-2126x/
 * 2136x/2137x/2146x/2147x/2148x Processor Booting".
 * <p>
 * The stream is replayed in order into a model of the part's internal memory -- four SRAM
 * blocks seen through their 48-bit, normal-word, short-word and long-word addresses -- and
 * external memory, so later blocks overwrite earlier ones as they do on the processor.  The
 * result, the memory as it is when the final block hands over, is presented in the two
 * spaces of the SHARC language:
 * <ul>
 * <li>{@code sw}, the code space in short words: every internal block's short-word view,
 * with 48-bit instructions at their short-word alias, most significant parcel first, and
 * the context bit {@code visa} cleared over them;</li>
 * <li>{@code dm}, the data space in normal words: every internal block's normal-word view,
 * external memory, and the IOP register range (uninitialized, volatile).</li>
 * </ul>
 * Block tags: FINAL_INIT (the interrupt vector table; the header's count and address words
 * carry the instruction the kernel's final sequence writes to IVT+0x30, and IVT+4 receives
 * {@code PM(0,I8) = PX}), ZERO_LDATA, ZERO_L48, INIT_L16, INIT_L32, INIT_L48 (two 48-bit
 * words in three 32-bit words), INIT_L64, ZERO_EXT8/16 and INIT_EXT8/16 (32-bit words),
 * and compressed blocks (tag 0x2000, zlib), which are inflated and replayed in place.
 * A stream may continue after a FINAL_INIT (a kernel that reloads itself, then boots the
 * next part of the stream); all of it is replayed.  MULTI_PROC streams are not supported.
 */
public class SharcLdrLoader extends AbstractProgramWrapperLoader {

	public static final String NAME = "ADI SHARC Boot Stream (LDR)";
	private static final LanguageCompilerSpecPair LANGUAGE =
		new LanguageCompilerSpecPair("SHARC:BE:32:214xx", "default");

	/** The boot kernel: 256 48-bit instructions, INIT_L48-packed, loaded to the IVT. */
	static final int KERNEL_BYTES = 256 * 6;
	static final long IVT = 0x8c000;
	private static final int MAX_FILE = 64 << 20;
	private static final int COMPRESSED = 0x2000;
	private static final String[] TAGS = { "FINAL_INIT", "ZERO_LDATA", "ZERO_L48", "INIT_L16",
		"INIT_L32", "INIT_L48", "INIT_L64", "ZERO_EXT8", "ZERO_EXT16", "INIT_EXT8", "INIT_EXT16" };

	@Override
	public String getName() {
		return NAME;
	}

	// Loader.getAssociatedFileExtensions() in Ghidra 12.3 and later
	public Collection<String> getAssociatedFileExtensions() {
		return List.of("ldr");
	}

	/** The interrupt vector table (sharc214xx.pspec) holds the entry points of a boot image. */
	@Override
	protected boolean shouldApplyProcessorLabelsByDefault() {
		return true;
	}

	@Override
	public Collection<LoadSpec> findSupportedLoadSpecs(ByteProvider provider) throws IOException {
		if (provider.length() < 12 || provider.length() > MAX_FILE) {
			return List.of();
		}
		byte[] buf = provider.readBytes(0, provider.length());
		if (findStart(buf) < 0) {
			return List.of();
		}
		return List.of(new LoadSpec(this, 0, LANGUAGE, true));
	}

	/**
	 * Offset of the first block header: 0 for a bare block stream, KERNEL_BYTES when the
	 * stream starts with a boot kernel, -1 if the bytes are not a boot stream.
	 */
	static int findStart(byte[] buf) {
		if (walk(buf, 0, null) == buf.length) {
			return 0;
		}
		if (buf.length > KERNEL_BYTES + 12 && walk(buf, KERNEL_BYTES, null) == buf.length) {
			return KERNEL_BYTES;
		}
		return -1;
	}

	/** One block of the stream. */
	record Block(int offset, int tag, long count, long address, byte[] data) {
		String name() {
			return tag == COMPRESSED ? "COMPRESSED" : TAGS[tag];
		}
	}

	private static long u32(byte[] b, int o) {
		return (b[o] & 0xffL) | ((b[o + 1] & 0xffL) << 8) | ((b[o + 2] & 0xffL) << 16) |
			((b[o + 3] & 0xffL) << 24);
	}

	/**
	 * Bytes of data following a block header, or -1 for a header that is not valid.
	 * A compressed block's header holds the compressed byte count and the window size
	 * (upper 16 bits) / pad byte count (lower 16 bits); the manual's figure shows the two
	 * words in one order and some streams use the other, so both are accepted.
	 */
	private static long dataSize(int tag, long count, long address) {
		switch (tag) {
			case 0:
				return KERNEL_BYTES;
			case 1, 2, 7, 8:
				return 0;
			case 3:
				return ((count + 1) / 2) * 4;
			case 4, 9, 10:
				return count * 4;
			case 5:
				return ((count + 1) / 2) * 12;
			case 6:
				return count * 8;
			case COMPRESSED: {
				long[] cp = compressedCounts(count, address);
				return cp == null ? -1 : cp[0] + cp[1];
			}
			default:
				return -1;
		}
	}

	/** {byte count, pad count, window bits} of a compressed block header, or null. */
	private static long[] compressedCounts(long count, long address) {
		for (long[] c : new long[][] { { count, address }, { address, count } }) {
			long wbits = c[1] >>> 16, pad = c[1] & 0xffff;
			if (wbits >= 8 && wbits <= 15 && pad < 4 && (c[0] + pad) % 4 == 0) {
				return new long[] { c[0], pad, wbits };
			}
		}
		return null;
	}

	/**
	 * Walk the block headers from {@code offset}; returns the offset reached (the buffer
	 * length for a well-formed stream) or -1.  Blocks are added to {@code out} if given.
	 */
	static int walk(byte[] buf, int offset, List<Block> out) {
		int o = offset;
		int n = 0;
		while (o + 12 <= buf.length) {
			long tagWord = u32(buf, o);
			long count = u32(buf, o + 4);
			long address = u32(buf, o + 8);
			int tag = (int) tagWord;
			if (tagWord > 0xffff || (tag > 10 && tag != COMPRESSED)) {
				return -1;
			}
			long size = dataSize(tag, count, address);
			if (size < 0 || o + 12 + size > buf.length) {
				return -1;
			}
			if (out != null) {
				out.add(new Block(o, tag, count, address,
					Arrays.copyOfRange(buf, o + 12, (int) (o + 12 + size))));
			}
			o += 12 + (int) size;
			n++;
		}
		return n > 0 ? o : -1;
	}

	@Override
	protected void load(Program program, ImporterSettings settings)
			throws CancelledException, IOException {
		MessageLog log = settings.log();
		TaskMonitor monitor = settings.monitor();
		ByteProvider provider = settings.provider();
		byte[] buf = provider.readBytes(0, provider.length());
		int start = findStart(buf);
		if (start < 0) {
			throw new IOException("not a SHARC boot stream");
		}
		Image image = new Image();
		List<String> notes = new ArrayList<>();
		if (start == KERNEL_BYTES) {
			image.initL48(IVT, 256, Arrays.copyOf(buf, KERNEL_BYTES));
			notes.add("boot kernel -> IVT 0x8c000");
		}
		replay(buf, start, image, notes, 0, monitor);
		for (String n : notes) {
			log.appendMsg(NAME, n);
		}
		try {
			image.create(program, monitor, log);
		}
		catch (Exception e) {
			throw new IOException("could not create the memory of " + provider.getName(), e);
		}
	}

	private void replay(byte[] buf, int start, Image image, List<String> notes, int depth,
			TaskMonitor monitor) throws IOException, CancelledException {
		List<Block> blocks = new ArrayList<>();
		if (walk(buf, start, blocks) != buf.length) {
			throw new IOException("malformed block stream at depth " + depth);
		}
		for (Block b : blocks) {
			monitor.checkCancelled();
			notes.add(String.format("%s%s at 0x%x: count=%d address=0x%x", "  ".repeat(depth),
				b.name(), b.offset, b.count, b.address));
			switch (b.tag) {
				case 0 -> {
					image.initL48(IVT, 256, b.data);
					// the kernel's final sequence (Loader manual, FINAL_INIT): the saved
					// instruction goes to IVT+0x30, PM(0,I8)=PX stays at IVT+4
					image.write48(IVT + 0x30, (b.address << 16) | (b.count >>> 16));
					image.write48(IVT + 4, 0xb16b00000000L);
				}
				case 1, 7, 8 -> image.zero(b.address, b.count);
				case 2 -> {
					for (long k = 0; k < b.count; k++) {
						image.write48(b.address + k, 0);
					}
				}
				case 3 -> {
					for (int k = 0; k < b.count; k++) {
						image.write16(b.address + k,
							(b.data[2 * k] & 0xff) | ((b.data[2 * k + 1] & 0xff) << 8));
					}
				}
				case 4, 9, 10 -> {
					for (int k = 0; k < b.count; k++) {
						image.write32(b.address + k, u32(b.data, 4 * k));
					}
				}
				case 5 -> image.initL48(b.address, b.count, b.data);
				case 6 -> {
					for (int k = 0; k < b.count; k++) {
						image.write32(2 * (b.address + k), u32(b.data, 8 * k));
						image.write32(2 * (b.address + k) + 1, u32(b.data, 8 * k + 4));
					}
				}
				case COMPRESSED -> {
					if (depth > 2) {
						throw new IOException("nested compressed blocks");
					}
					long[] cp = compressedCounts(b.count, b.address);
					byte[] inflated = inflate(b.data, (int) cp[0]);
					notes.add(String.format("%s  zlib (window 2^%d): %d -> %d bytes",
						"  ".repeat(depth), cp[2], cp[0], inflated.length));
					replay(inflated, 0, image, notes, depth + 1, monitor);
				}
				default -> throw new IOException("unsupported block tag 0x" +
					Integer.toHexString(b.tag));
			}
		}
	}

	/**
	 * Inflate a compressed block.  The loader stores the zlib stream in 32-bit words that
	 * the boot DMA delivers least significant byte first; the decompression kernel consumes
	 * each word's bytes most significant first.
	 */
	static byte[] inflate(byte[] data, int length) throws IOException {
		byte[] z = new byte[data.length];
		for (int k = 0; k + 3 < data.length; k += 4) {
			z[k] = data[k + 3];
			z[k + 1] = data[k + 2];
			z[k + 2] = data[k + 1];
			z[k + 3] = data[k];
		}
		for (boolean raw : new boolean[] { false, true }) {
			Inflater inf = new Inflater(raw);
			try {
				inf.setInput(z, 0, length);
				ByteArrayOutputStream out = new ByteArrayOutputStream();
				byte[] chunk = new byte[1 << 16];
				while (!inf.finished()) {
					int n = inf.inflate(chunk);
					if (n == 0 && (inf.needsInput() || inf.needsDictionary())) {
						break;
					}
					out.write(chunk, 0, n);
				}
				if (inf.finished()) {
					return out.toByteArray();
				}
			}
			catch (DataFormatException e) {
				// try the other framing
			}
			finally {
				inf.end();
			}
		}
		throw new IOException("compressed block does not inflate");
	}

	/**
	 * Internal memory of a 5-Mbit ADSP-214xx (ADSP-21467/21469, 21479, 21483-21489) as one
	 * array of short words per SRAM block, indexed by short-word address.  Normal word n is
	 * short words 2n (low half) and 2n+1; long word l is 4l..4l+3; 48-bit word a is the three
	 * short words from 3a - (a &amp; 0xe0000), least significant first.  External memory is
	 * kept as 32-bit words at normal-word addresses 0x200000 and up.
	 */
	static final class Image {
		static final long[][] BLOCKS = { // short-word base, length
			{ 0x124000, 0x18000 }, { 0x164000, 0x18000 }, { 0x180000, 0x10000 },
			{ 0x1c0000, 0x10000 } };
		static final long EXT = 0x200000;

		final short[][] shorts = new short[4][];
		final BitSet[] defined = new BitSet[4];
		final BitSet[] isaStart = new BitSet[4];	// first short of a 48-bit word
		final TreeMap<Long, Long> ext = new TreeMap<>();

		Image() {
			for (int b = 0; b < 4; b++) {
				shorts[b] = new short[(int) BLOCKS[b][1]];
				defined[b] = new BitSet();
				isaStart[b] = new BitSet();
			}
		}

		static int block(long sw) {
			for (int b = 0; b < 4; b++) {
				if (sw >= BLOCKS[b][0] && sw < BLOCKS[b][0] + BLOCKS[b][1]) {
					return b;
				}
			}
			return -1;
		}

		static long sw48(long a) {
			return 3 * a - (a & 0xe0000);
		}

		private void put(long sw, int value, boolean fromIsa) throws IOException {
			int b = block(sw);
			if (b < 0) {
				throw new IOException(String.format("address outside internal memory: sw 0x%x", sw));
			}
			int i = (int) (sw - BLOCKS[b][0]);
			if (!fromIsa) {
				for (int s = Math.max(0, i - 2); s <= i; s++) {	// a 48-bit word partly overwritten
					if (isaStart[b].get(s)) {
						isaStart[b].clear(s);
					}
				}
			}
			shorts[b][i] = (short) value;
			defined[b].set(i);
		}

		void write16(long sw, int v) throws IOException {
			put(sw, v, false);
		}

		void write32(long nw, long v) throws IOException {
			if (nw >= EXT) {
				ext.put(nw, v & 0xffffffffL);
				return;
			}
			put(2 * nw, (int) (v & 0xffff), false);
			put(2 * nw + 1, (int) ((v >>> 16) & 0xffff), false);
		}

		void write48(long a, long v) throws IOException {
			long s = sw48(a);
			put(s, (int) (v & 0xffff), true);
			put(s + 1, (int) ((v >>> 16) & 0xffff), true);
			put(s + 2, (int) ((v >>> 32) & 0xffff), true);
			int b = block(s);
			int i = (int) (s - BLOCKS[b][0]);
			isaStart[b].set(i);
			isaStart[b].clear(i + 1, i + 3);
		}

		/** INIT_L48: two 48-bit words in three 32-bit words (manual Table 6-15). */
		void initL48(long a, long count, byte[] data) throws IOException {
			for (int k = 0; k < count; k++) {
				int p = (k / 2) * 12;
				long w0 = u32(data, p), w1 = u32(data, p + 4), w2 = u32(data, p + 8);
				long v = (k % 2 == 0) ? ((w1 & 0xffff) << 32) | w0 : (w2 << 16) | (w1 >>> 16);
				write48(a + k, v);
			}
		}

		/** ZERO_LDATA/ZERO_EXT: the address says whether short, normal or long words. */
		void zero(long a, long count) throws IOException {
			for (long k = 0; k < count; k++) {
				long x = a + k;
				if (block(x) >= 0) {
					write16(x, 0);
				}
				else if (x >= EXT || block(2 * x) >= 0) {
					write32(x, 0);
				}
				else if (block(4 * x) >= 0) {
					write32(2 * x, 0);
					write32(2 * x + 1, 0);
				}
				else {
					throw new IOException(String.format("ZERO block address 0x%x not mapped", x));
				}
			}
		}

		void create(Program program, TaskMonitor monitor, MessageLog log) throws Exception {
			AddressSpace sw = program.getAddressFactory().getDefaultAddressSpace();
			AddressSpace dm = program.getAddressFactory().getAddressSpace("dm");
			Memory mem = program.getMemory();
			Register visa = program.getRegister("visa");
			ProgramContext ctx = program.getProgramContext();
			for (int b = 0; b < 4; b++) {
				if (defined[b].isEmpty()) {
					continue;
				}
				int lo = defined[b].nextSetBit(0), hi = defined[b].length() - 1;
				long base = BLOCKS[b][0];
				// short-word view: 48-bit words most significant parcel first
				byte[] code = new byte[2 * (hi - lo + 1)];
				List<long[]> isa = new ArrayList<>();
				for (int i = lo; i <= hi;) {
					if (isaStart[b].get(i) && i + 2 <= hi) {
						for (int k = 0; k < 3; k++) {
							short v = shorts[b][i + 2 - k];
							code[2 * (i - lo + k)] = (byte) (v >> 8);
							code[2 * (i - lo + k) + 1] = (byte) v;
						}
						if (!isa.isEmpty() && isa.get(isa.size() - 1)[1] == i - 1) {
							isa.get(isa.size() - 1)[1] = i + 2;
						}
						else {
							isa.add(new long[] { i, i + 2 });
						}
						i += 3;
					}
					else {
						code[2 * (i - lo)] = (byte) (shorts[b][i] >> 8);
						code[2 * (i - lo) + 1] = (byte) shorts[b][i];
						i++;
					}
				}
				MemoryBlock mb = MemoryBlockUtils.createInitializedBlock(program, false,
					"blk" + b + "_sw", sw.getAddress(base + lo, true),
					new java.io.ByteArrayInputStream(code), code.length,
					"internal block " + b + ", short-word view (code)", null, true, true, true,
					log, monitor);
				if (mb == null) {
					continue;
				}
				for (long[] r : isa) {
					ctx.setValue(visa, sw.getAddress(base + r[0], true),
						sw.getAddress(base + r[1], true).add(1), BigInteger.ZERO);
				}
				// normal-word view
				long nlo = (base + lo) / 2, nhi = (base + hi) / 2;
				byte[] data = new byte[(int) (4 * (nhi - nlo + 1))];
				for (long n = nlo; n <= nhi; n++) {
					int i = (int) (2 * n - base);
					int v = (shorts[b][i] & 0xffff) | ((shorts[b][i + 1] & 0xffff) << 16);
					int p = (int) (4 * (n - nlo));
					data[p] = (byte) (v >>> 24);
					data[p + 1] = (byte) (v >>> 16);
					data[p + 2] = (byte) (v >>> 8);
					data[p + 3] = (byte) v;
				}
				MemoryBlockUtils.createInitializedBlock(program, false, "blk" + b + "_nw",
					dm.getAddress(nlo, true), new java.io.ByteArrayInputStream(data), data.length,
					"internal block " + b + ", normal-word view (data)", null, true, true, false,
					log, monitor);
			}
			// external memory: one block per run of consecutive words
			long runStart = -1, prev = -2;
			List<long[]> runs = new ArrayList<>();
			for (long n : ext.keySet()) {
				if (n != prev + 1) {
					if (runStart >= 0) {
						runs.add(new long[] { runStart, prev });
					}
					runStart = n;
				}
				prev = n;
			}
			if (runStart >= 0) {
				runs.add(new long[] { runStart, prev });
			}
			for (long[] r : runs) {
				byte[] data = new byte[(int) (4 * (r[1] - r[0] + 1))];
				for (long n = r[0]; n <= r[1]; n++) {
					long v = ext.get(n);
					int p = (int) (4 * (n - r[0]));
					data[p] = (byte) (v >>> 24);
					data[p + 1] = (byte) (v >>> 16);
					data[p + 2] = (byte) (v >>> 8);
					data[p + 3] = (byte) v;
				}
				MemoryBlockUtils.createInitializedBlock(program, false,
					String.format("ext_%x", r[0]), dm.getAddress(r[0], true),
					new java.io.ByteArrayInputStream(data), data.length, "external memory",
					null, true, true, false, log, monitor);
			}
			MemoryBlock iop = mem.createUninitializedBlock("iop", dm.getAddress(0, true),
				0x40000L * 4, false);
			iop.setVolatile(true);
			iop.setWrite(true);
		}
	}
}
