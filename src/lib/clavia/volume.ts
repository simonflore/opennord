/**
 * Nord volume curve: 7-bit value (0-127) -> displayed dB. Vendored from
 * ns3-program-viewer's nord-mapping.js `dBMap` (Chris55; ATTRIBUTION.md) —
 * a factual lookup table shared across NS2/NS3 engine volumes.
 */
export const NORD_DB: readonly string[] = [
  "Off","-84.2 dB","-72.1 dB","-65.1 dB","-60.1 dB","-56.2 dB","-53.0 dB","-50.3 dB",
  "-48.0 dB","-46.0 dB","-44.2 dB","-42.5 dB","-41.0 dB","-39.6 dB","-38.3 dB","-37.1 dB",
  "-36.0 dB","-34.9 dB","-33.9 dB","-33.0 dB","-32.1 dB","-31.1 dB","-30.5 dB","-29.7 dB",
  "-28.9 dB","-28.2 dB","-27.6 dB","-26.9 dB","-26.3 dB","-25.7 dB","-25.1 dB","-24.5 dB",
  "-23.9 dB","-23.4 dB","-22.9 dB","-22.4 dB","-21.9 dB","-21.4 dB","-21.0 dB","-20.5 dB",
  "-20.1 dB","-19.6 dB","-19.2 dB","-18.8 dB","-18.4 dB","-18.0 dB","-17.6 dB","-17.3 dB",
  "-16.9 dB","-16.5 dB","-16.2 dB","-15.8 dB","-15.5 dB","-15.2 dB","-14.9 dB","-14.5 dB",
  "-14.2 dB","-13.9 dB","-13.6 dB","-13.3 dB","-13.0 dB","-12.7 dB","-12.5 dB","-12.2 dB",
  "-11.9 dB","-11.6 dB","-11.4 dB","-11.1 dB","-10.9 dB","-10.6 dB","-10.3 dB","-10.1 dB",
  "-9.9 dB","-9.6 dB","-9.4 dB","-9.1 dB","-8.9 dB","-8.7 dB","-8.5 dB","-8.2 dB",
  "-8.0 dB","-7.8 dB","-7.6 dB","-7.4 dB","-7.2 dB","-7.0 dB","-6.8 dB","-6.6 dB",
  "-6.4 dB","-6.2 dB","-6.0 dB","-5.8 dB","-5.6 dB","-5.4 dB","-5.2 dB","-5.0 dB",
  "-4.9 dB","-4.7 dB","-4.5 dB","-4.3 dB","-4.2 dB","-4.0 dB","-3.8 dB","-3.6 dB",
  "-3.5 dB","-3.3 dB","-3.1 dB","-3.0 dB","-2.8 dB","-2.7 dB","-2.5 dB","-2.3 dB",
  "-2.2 dB","-2.0 dB","-1.9 dB","-1.7 dB","-1.6 dB","-1.4 dB","-1.3 dB","-1.1 dB",
  "-1.0 dB","-0.8 dB","-0.7 dB","-0.6 dB","-0.4 dB","-0.3 dB","-0.1 dB","0.0 dB",
];
