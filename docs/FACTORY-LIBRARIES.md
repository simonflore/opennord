# Factory libraries — resolution & the catalog manifest

OpenNord backs up and restores **user** content but skips Nord's **factory**
content (piano `.npno`, sample `.nsmp4`) — gigabytes, and re-downloadable from
Nord. This documents how OpenNord resolves that factory content to official
downloads (Slice 4), and what's deliberately left out.

## The catalog manifest

Nord Sound Manager fetches its factory catalog over HTTPS (libcurl) from:

    https://nord-sound-manager.s3.eu-west-3.amazonaws.com/clavia_sound_libraries.xml

It is **publicly fetchable** (no auth). Structure:

    <clavia version="…">
      <sound_libraries>
        <library type="piano|sample">
          <bank name="…" category="5,0">
            <instrument name="…">
              <item version="6.3" name="White Grand">
                <file url="…/from_file_name/White_Grand_XL_6.3.npno/"
                      size_kb="208537" size_description="XL" />

There is **no CRC or id** at the file level. Files are matched by the URL's
**filename** (`White_Grand_XL_6.3.npno`), which equals the device file name with
spaces→underscores — so a device/display name + version resolves to the official
download URL.

## How OpenNord uses it

- A build-time script (`scripts/gen-factory-libs.mjs`) fetches + parses the
  manifest into a committed snapshot (`src/lib/device/factory-libs.generated.ts`).
  Re-run it to refresh (the manifest updates ~monthly).
- A pure resolver (`src/lib/device/factory.ts`, `resolveFactory`) maps a name →
  official URL.
- Program Studio deep-links referenced samples and the piano model to the exact
  download; restore lists skipped factory libraries with download links.

## Why a snapshot, not a live fetch

OpenNord is a no-backend PWA; a browser fetch of the S3/nordkeyboards.com manifest
is CORS-blocked (NSM uses libcurl, no CORS). The committed snapshot is
deterministic, offline, and testable. Live fetch is a future option behind a
CORS-enabled endpoint or proxy.

## Out of scope (and why)

**Automated download + install of factory content to the device.** The manifest
gives download URLs, not an install method; whether the USB FileTransfer protocol
can write the sample/piano partitions the way it writes programs is unverified, the
transfers are gigabytes, and pushing Nord's audio through OpenNord is legally
sensitive (`docs/LEGAL.md`). OpenNord resolves + deep-links; the user downloads
from Nord and installs with Nord Sound Manager.

## Legal

Deep-links to Nord's official URLs only. OpenNord never hosts or transfers Nord's
sample/piano audio. See `docs/LEGAL.md`.
