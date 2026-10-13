/**
 * Effect value tables the Stage 2 and Stage 3 share. Facts from Chris55's
 * nord-documentation (BSD-3-Clause, https://chris55.github.io/nord-documentation/),
 * "NS3 Amp Sim Eq Mid Flt Freq" / "NS2 Eq Mid Flt Freq": the two tables are
 * identical, and equal to the Stage 4 firmware's mid-frequency table.
 */

/** The EQ's swept mid frequency, stored 0–127 → 200 Hz … 8.0 kHz. */
export const EQ_MID_FREQ: readonly string[] = [
  '200 Hz','205 Hz','210 Hz','215 Hz','221 Hz','226 Hz','232 Hz','238 Hz','244 Hz','250 Hz',
  '257 Hz','263 Hz','270 Hz','277 Hz','284 Hz','291 Hz','299 Hz','306 Hz','314 Hz','322 Hz',
  '330 Hz','339 Hz','347 Hz','356 Hz','365 Hz','375 Hz','384 Hz','394 Hz','404 Hz','414 Hz',
  '425 Hz','436 Hz','447 Hz','458 Hz','470 Hz','482 Hz','494 Hz','507 Hz','520 Hz','533 Hz',
  '546 Hz','560 Hz','575 Hz','589 Hz','604 Hz','620 Hz','635 Hz','652 Hz','668 Hz','685 Hz',
  '703 Hz','721 Hz','739 Hz','758 Hz','777 Hz','797 Hz','817 Hz','838 Hz','859 Hz','881 Hz',
  '904 Hz','927 Hz','950 Hz','975 Hz','999 Hz','1.0 kHz','1.1 kHz','1.1 kHz','1.1 kHz','1.2 kHz',
  '1.2 kHz','1.3 kHz','1.3 kHz','1.3 kHz','1.4 kHz','1.4 kHz','1.5 kHz','1.5 kHz','1.6 kHz','1.6 kHz',
  '1.7 kHz','1.8 kHz','1.8 kHz','1.9 kHz','1.9 kHz','2.0 kHz','2.1 kHz','2.1 kHz','2.2 kHz','2.3 kHz',
  '2.4 kHz','2.4 kHz','2.5 kHz','2.6 kHz','2.7 kHz','2.8 kHz','2.9 kHz','3.0 kHz','3.1 kHz','3.2 kHz',
  '3.3 kHz','3.4 kHz','3.5 kHz','3.6 kHz','3.7 kHz','3.9 kHz','4.0 kHz','4.1 kHz','4.3 kHz','4.4 kHz',
  '4.6 kHz','4.7 kHz','4.9 kHz','5.0 kHz','5.2 kHz','5.4 kHz','5.6 kHz','5.8 kHz','5.9 kHz','6.1 kHz',
  '6.3 kHz','6.6 kHz','6.8 kHz','7.0 kHz','7.2 kHz','7.5 kHz','7.7 kHz','8.0 kHz',
];

/** An effect block's source selector on the Stage 2 and Stage 3 ("0 = Organ, 1 = Piano, 2 = Synth"). */
export const EFFECT_SRC: readonly string[] = ['Organ', 'Piano', 'Synth'];
