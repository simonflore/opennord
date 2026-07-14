# Local RE fixture corpus

Drop **real Nord files** here, one folder per model, to feed the auto-RE harness:

```
fixtures/<model-id>/AnyName.ns3f      # programs / presets / performances
fixtures/<model-id>/Backup.ns3b       # backups (ZIP)
fixtures/<model-id>/Sample.nsmp3      # samples
```

`<model-id>` is a key from `src/lib/clavia/partitions.ts` — e.g. `stage-3`, `electro-6`,
`piano-6`, `grand-2`, `wave-2`.

Then run:

```
npm run fixtures:scan
```

It identifies each file (CBIN tag/version, sample codec, backup contents), cross-checks it
against the per-model registry, and prints what it learned — including mismatches, which are
the reverse-engineering signal.

## This folder is **never committed**

Everything here except this README is gitignored. These are local RE material only. Per
`docs/LEGAL.md`, OpenNord never hosts or redistributes sourced files — factory content
especially. Source files from your own account/instrument; keep them on your machine.
