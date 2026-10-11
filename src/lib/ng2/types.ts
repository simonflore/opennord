/**
 * Nord Grand 2 (`.ng2p`) program model.
 *
 * The Grand 2 OS 1.22 firmware registry (FUN_c01125f8; program archive
 * FUN_c010dac0, whose accepted version range sits in a RAM global and was not
 * recovered — corpus files are 1.02) gives the body as a block chain: u32
 * version, then eleven length-prefixed blocks — MultiCom 10 · PnoCom 5 · PnoA/B
 * 13 · PnoFxA/B 21 · SynCom 5 · SynA/B 20 · SynFxA/B 21 — a 185-byte body. The
 * Piano 6 uses the same blocks with three deltas (see np6/types.ts).
 * Negative-min fields are two's complement in their width.
 *
 * Fields come from the generated layout (`layout.generated.ts`), each citing its
 * firmware parameter id. Per piano block (Piano A at body bit 176, B at 288):
 * LayerLevel 0–6 · KbdZone 7–8 · OctaveShift 9–12 · Sustain 13 · VolumePedal 14
 * · Bank (type) 15–17 · Entry 18–22 · Variation 23–24 · NameHash 25–56 ·
 * Acoustic 57–58 · PedalNoise 59 · Touch 60–61 · Unison 62–63 · DynComp 64–65 ·
 * Eq 66–69. Layer enables are PnoCom/SynCom `LayerEnable` (2 bits), read as a
 * bitmask (A = 1, B = 2; medium).
 *
 * Superseded corpus-era readings (2026-06-22 decoder): the 72-bit per-layer
 * cluster used the Stage 4 field order, so from bit 15 on its fields were
 * shifted — its 32-bit "model id" at cluster bit 28 sat 3 bits after the
 * NameHash, and "pianoOn" was the top bit of LayerLevel; `layerBActiveFlag`
 * (body[8] bit 7) is `Com_kEffectsRvbChorale`; globalParam1/2 (body[16]/[94])
 * are PnoCom/SynCom LayerFocus + LayerEnable; the "extended", "effects" and
 * "final" clusters are the PnoFx, Syn and SynFx blocks, and the "TLV tags" are
 * their length bytes.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Ng2FieldKey } from './layout.generated';

export type { Ng2FieldKey };

export interface Ng2Program extends FwProgram<Ng2FieldKey> {
  readonly format: 'ng2p';
}
