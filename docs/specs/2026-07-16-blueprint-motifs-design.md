# Blueprint Motifs in Studio Dark

**Date:** 2026-07-16
**Status:** Approved design
**Plan:** `docs/plans/2026-07-16-blueprint-motifs.md` (core-relative)
**Scope:** A typographic + structural evolution of the **Studio Dark** design
system in `packages/core`, inspired by the editorial language of
`slashwork.com/roadmap`. Adds a display type scale, a monospace eyebrow label,
and a dashed blueprint grid. The palette is **unchanged** — still dark-only,
still one red accent. Validated on one editorial screen (HomeView) and one dense
tool screen (LibraryView) before any wider rollout.

---

## 1. Decisions (settled in brainstorming)

| Question | Decision |
|---|---|
| Scope | Borrow structural motifs **into** Studio Dark. No light canvas, no forked "marketing" system |
| Palette | Unchanged — dark-only, single `--red` accent. The reference's four color cards are **rejected** |
| Display type | **Weight follows size**: display steps thin (300) + huge; UI text (≤17px) stays bold/medium |
| Typeface | System fonts (`-apple-system`/`system-ui`) + tighter tracking. Zero webfont bytes |
| Blueprint grid | App-wide, **including tool surfaces** — but frame-level only, never inside a component |
| Grid on dense surfaces | A `quiet` variant (lower opacity, major crosshairs only) for library/device |
| Sequencing | Vertical slice: HomeView (spacious) + LibraryView (dense) in the same pass |

### Why the color cards are rejected

Not merely the one-accent rule. Studio Dark **already has** orange, green, cyan
and blue — `--warn`, `--connected`, `--lcd-cyan`, `--focus` — and they are
**semantic**: green means the keyboard is connected. Using them decoratively
would make a green card quietly assert "connected" on a page where nothing is.
So the eyebrow labels and the grid must carry the visual interest the reference
gets from color.

## 2. What transfers, and what doesn't

| Reference motif | Verdict |
|---|---|
| Monospace uppercase eyebrow labels | **Adopt** — as a `ui/` primitive |
| Dashed grid + crosshair markers | **Adopt** — app-wide, frame-level only |
| Oversized thin display type | **Adopt** — via weight-follows-size |
| Generous whitespace / section rhythm | **Adopt** — clamped for mobile |
| Editorial prose voice | **Adopt** — eyebrows as claims (§4) |
| Light / off-white canvas | **Reject** — contradicts Studio Dark |
| Four saturated color cards | **Reject** — collides with semantic colors (§1) |
| Portrait quote card | **Reject** — editorial furniture, no product use |

## 3. The display type scale

Tailwind v4 lets a font-size token carry its own weight, leading, and tracking.
That makes "weight follows size" **structural rather than conventional**: a
component cannot pick up `text-display-1` without also picking up its light
weight and tight leading. This is principle 1 (one token source) doing real work.

```css
@theme {
  --text-display-1: clamp(3.5rem, 11vw, 9.25rem);
  --text-display-1--font-weight: 300;
  --text-display-1--line-height: 0.92;
  --text-display-1--letter-spacing: -0.04em;

  --text-display-2: clamp(2.25rem, 6vw, 4.75rem);
  --text-display-2--font-weight: 300;
  --text-display-2--line-height: 1;
  --text-display-2--letter-spacing: -0.03em;

  --text-display-3: clamp(1.5rem, 3.2vw, 2.5rem);
  --text-display-3--font-weight: 400;
  --text-display-3--line-height: 1.1;
  --text-display-3--letter-spacing: -0.02em;
}
```

| Step | Size | Weight | Leading | Use |
|---|---|---|---|---|
| `display-1` | clamp(56px, 11vw, 148px) | 300 | 0.92 | Page heroes |
| `display-2` | clamp(36px, 6vw, 76px) | 300 | 1.0 | Section titles |
| `display-3` | clamp(24px, 3.2vw, 40px) | 400 | 1.1 | Sub-sections, dense-surface titles |
| *(existing UI text)* | 11–17px | 600–800 | 1.5–1.6 | **Unchanged** |

The crossover sits at ~24px: above it thin, below it bold.

Weight **300** is chosen because it is the lightest weight that exists as a real
cut across SF Pro, Segoe UI Light, *and* Roboto Light. `display-1` may drop to
200–250 on Apple platforms; that is deferred to visual review rather than guessed
here.

Staying on system fonts pays off precisely at these sizes: `-apple-system`
auto-switches SF Pro to **Display** optical sizing above ~20px, so the large
steps get proper display cutting (tighter spacing, finer detail) for free.

**Verify on first build:** the `--text-*--font-weight` modifier syntax is Tailwind
v4; confirm the generated utility carries all four properties.

## 4. The `<Eyebrow>` primitive

`src/components/ui/Eyebrow.tsx` — a `cva` component, **not** a new `@utility`.
Per principle 4, `@utility` is reserved for composite *treatments* (`fill-*`,
`elev-*`, `glow`); a labelled text element with a bullet is a primitive.

Renders: `--font-mono` (SF Mono via `ui-monospace`, zero cost), uppercase, ~10px,
wide tracking, `text-muted`, with a leading bullet in an `aria-hidden` span.

This replaces the ad-hoc `text-[10px] font-bold uppercase tracking-[0.6px]
text-muted` pattern already scattered through HomeView.

**Editorial rule — eyebrows are claims, not labels.** The reference's
"DIRECTIONAL, NOT FIXED" argues a position; it does not name a section. Applied
here:

- Coverage → `● STAGE FIRST, FAMILY NEXT` (not `● COVERAGE`) — carries the
  "think family, not just Stage 4" framing the CLAUDE.md keeps insisting on
- Device → `● HARDWARE OPTIONAL` — carries working principle 2
- Library → `● YOUR PATCHES, READABLE`

An eyebrow that merely names its section is a review failure.

## 5. The `<Blueprint>` frame

One new token:

```css
@theme {
  --color-grid: #343a47;  /* one step brighter than --line (#2b2f39) */
}
```

Rationale: a dashed rule shows roughly half the ink of a solid one, and `--line`
on `--bg` is already near the visibility threshold. The grid needs its own token
rather than reusing `--line`.

Component: `src/components/ui/Blueprint.tsx`. Renders dashed verticals at the
**real content-column edges**, dashed horizontals at section boundaries, and
crosshairs at their intersections. `aria-hidden`, `pointer-events-none`, layered
behind content.

Tracking the actual content column is what keeps this structural rather than
wallpaper — it draws the layout's real spine. It is also thematically honest:
OpenNord is a reverse-engineering tool with a decode inspector, and a schematic
frame says "we mapped this instrument."

**The invariant:** the grid marks the page frame and section boundaries. It
**never enters a component's interior.** Library rows and the device slot grid
then read as objects sitting *on* a drafting table, rather than a second grid
fighting the first. This invariant is what makes the app-wide decision safe.

Variants:

- `full` — editorial surfaces (home, about, contribute, compatibility)
- `quiet` — dense tool surfaces (library, device, dev): reduced opacity,
  crosshairs at major intersections only

**Interaction with `stage-backdrop`:** its radial glow is brightest at top-center,
so the grid will be crispest at the top and fade toward the edges. Accepted as
intentional — it reads as raking light across a drafting table. Revisit at visual
review if it instead reads as inconsistent.

## 6. The vertical slice

The whole bet is *"does a blueprint grid survive on a dense tool surface?"* Doing
home alone would look great and prove nothing, because home is spacious and the
grid is guaranteed to work there. Both registers ship in the first pass, while
retreating is still cheap.

### HomeView (`src/components/home/HomeView.tsx`) — the spacious register

- Hero `h1` → `display-1` (from today's `clamp(30px,5.4vw,52px)` extrabold)
- `<Eyebrow>` per section, written as claims per §4
- `<Blueprint variant="full">`
- Section rhythm → `clamp(64px, 10vw, 160px)`. **Clamped** because the app is
  mobile-first: the reference's whitespace is a desktop luxury, and unclamped at
  phone width it is just scrolling.
- **Split the file.** It is 836 lines, it is the file this work disturbs most,
  and it already sits on obvious seams (Hero / Features / Coverage / Download).
  Targeted, not opportunistic refactoring.

### LibraryView (`src/components/library/LibraryView.tsx`) — the dense register

- `<Blueprint variant="quiet">`
- `<Eyebrow>` + title at `display-3` — deliberately not `display-2`; vertical
  space on a working surface is expensive
- **Patch rows, cards, tags, and the split view: unchanged.** They stay
  bold/medium and dense.

If the grid reads as noise behind real patch density, retreat to editorial-only,
having spent one screen.

## 7. Verification

- **CI gates:** `npm run typecheck`, `npm run lint`, `npm test` — all three stay
  green. Stylelint's no-hardcoded-hex rule actively enforces this design:
  `--color-grid` must be a token or lint fails.
- **Visual:** phone width first, then desktop (working principle 4, mobile-first).
- **Contrast:** confirm the display steps at weight 300 against WCAG on `--bg`.
  `--ink` (#e9ebf0) on `--bg` (#15171c) is high-contrast, so this is expected to
  pass — confirm rather than assume, since accessibility is "part of precise."
- **Known risk:** check whether `LibraryView.test.tsx` / `LibrarySplit.test.tsx`
  assert on class names; if so, restyling will be noisy and those assertions
  should move to roles/labels.

## 8. Docs to update

- `src/styles/tailwind-baseline.md` — add the display scale and `blueprint` to
  the token→utility cheatsheet
- `packages/core/CLAUDE.md` Design Context — Aesthetic Direction gains the
  blueprint/technical register; record the eyebrow editorial rule and the
  weight-follows-size rule
- **Fix a stale reference.** The Design Context cites
  `docs/superpowers/{specs,plans}/2026-06-14-ui-redesign*`. **No `ui-redesign`
  file exists anywhere in the repo** — the doc governing all UI work points at a
  missing spec. (The `docs/superpowers/` directory itself did exist under
  `packages/core/`; CLAUDE.md's paths are core-relative, as `docs/ROADMAP.md`
  and `docs/FORMAT.md` confirm. It has since been flattened to
  `packages/core/docs/{specs,plans}/`.) Repoint at the live convention and at
  this spec.
- **A second stale path, pre-existing:** the same line cites
  `docs/plans/2026-07-14-tailwind-migration.md`, but that file lives at the
  **repo root**, not under `packages/core/docs/`. Read core-relative like every
  other path in the file, it does not resolve. Out of scope to relocate the
  tailwind plan; flagged here so it is not mistaken for a new break.

## 9. Out of scope

- **Light theme.** The tokens already permit it as a second `[data-theme]` block;
  it is not part of this work.
- **Rollout beyond home + library.** About, contribute, compatibility, device,
  and dev follow once the slice validates.
- **`nord.css` instrument-panel visuals** (dials/LCD/drawbars) — remain
  hand-written CSS, untouched.
- **The palette, spacing scale, and radii** — unchanged.
