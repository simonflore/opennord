# Third-party licenses & provenance

OpenNord's `.ns4p` decoding is ported from community work. Notices preserved as required.

## ns4decode — MIT (the offset map, bit reader, value tables)

`src/lib/ns4/bits.ts`, `maps.ts`, and the value interpretation are ported from
**ns4decode** by **Randy** (with `ns4gui` co-authored by **guyd789** of the Nord
User Forum), distributed under the MIT License. The Nord Stage 4 program file
offset map (`ns4maps.py`) and decode logic originate there.

```
MIT License

Copyright (c) 2024 Randy
Copyright (c) 2025 guyd789 (Nord User Forum) & Randy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

MIT is compatible with OpenNord's AGPL-3.0: the ported portions retain this
notice; the combined work is distributed under AGPL-3.0.

## ns3-program-viewer — GPLv3 (referenced, not copied)

The Stage 2/3 format documentation by Chris55 & Nord User Forum members informed
our understanding. We **reference** it; we do not copy its GPLv3 source.

## midi.guide parameter data — CC BY-SA 4.0

If/when the live CC/NRPN parameter map is vendored (via ns4mcp), the underlying
addresses are from midi.guide (CC BY-SA 4.0) and must carry that attribution.

## Test fixture

`src/lib/ns4/__fixtures__/regressionTest.ns4p` and `expected/*.csv` are the
ns4decode regression test (MIT, © Randy), included to validate the port.
