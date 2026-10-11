# Tailwind ↔ token cheatsheet (Studio Dark)

Use utilities for chrome; keep `nord.css` + composite tokens as CSS.

| Want | Utility | (was) |
|---|---|---|
| surface bg | `bg-surface` | `background: var(--surface)` |
| sunken input/rail | `bg-sink` | `var(--sink)` |
| hairline border | `border border-line` | `1px solid var(--line)` |
| primary text | `text-ink` | `var(--ink)` |
| dim/muted text | `text-dim` / `text-muted` | `var(--dim)/(--muted)` |
| accent (active · selected · changed) | `bg-accent text-text-on-accent`, `text-accent` | `var(--accent)` (legacy name `--red`, `bg-red`) |
| engine identity (zones, tags) | `text-engine-synth/organ/piano` | `var(--engine-*)` |
| values, slots, sizes | `font-mono` (IBM Plex Mono) | `var(--mono)` |
| radius | `rounded-sm/md/lg` | `var(--r-sm/md/lg)` |
| display type (weight follows size) | `text-display-1/2/3` | — |
| blueprint grid line | `border-grid` / `bg-grid` | `var(--color-grid)` |
| editorial content column | `max-w-content` | `max-w-[1080px]` |
| space (4·8·12·16·24) | `p-1 p-2 p-3 p-4 p-6`, `gap-*`, `m-*` | `var(--s-*)` |
| top-lit panel fill | `bg-[var(--grad-surface)]` | `background: var(--grad-surface)` |
| elevation | `shadow-[var(--shadow-2)]` | `box-shadow: var(--shadow-2)` |
| red glow (primary) | `shadow-[var(--glow-red)]` | `var(--glow-red)` |
| motion | `transition-[all] duration-200 ease-[cubic-bezier(.2,.6,.2,1)]` or keep `--t-med` | `var(--t-med)` |
| breakpoint | `md:` (≈ `--bp-split` 900px) | media query |

## Composite tokens → semantic `@utility` (defined in tokens.css)

Gradients / layered shadows / glow are NOT single utilities — use the semantic
vocabulary, never inline `[background:var(--…)]` in components:

| Utility | is | use for |
|---|---|---|
| `fill-surface` / `fill-raised` / `fill-sink` | top-lit gradient fills | panels, cards, raised controls |
| `fill-primary` | accent gradient | primary CTA fills |
| `edge-hi` | top bevel highlight | — |
| `elev-1` / `elev-2` / `elev-3` | edge-hi + shadow-1/2, or shadow-3 | resting / raised / floating |
| `inset-1` | recessed shadow | pressed, sunken inputs |
| `glow` / `glow-hi` | accent halo (+ shadow-2) | primary affordance / its hover |

**Pattern (the Button is the reference):** `cva` for variants + `cn()` to merge;
raw utilities for layout/spacing/color; the vocabulary above for composites.
Interactive primitives (Dialog, Menu, Tabs, Toast, Tooltip, Select) → Radix,
copied-in shadcn-style, styled with these utilities.

**Never** put a raw hex in a component. A new color is written once, in the `:root`
block of `tokens.css`, and exposed as `--color-x: var(--x)` in `@theme inline`;
new composite treatments go in the `@utility` block in tokens.css.
Instrument visuals (dials/LCD/drawbars/waveform) stay in `nord.css`; every state of
them renders on the dev-only `/dev/kit` page — check it after touching either file.

## The blueprint register (spec: `docs/specs/2026-07-16-blueprint-motifs-design.md`)

**Display type — never override the weight.** `text-display-1/2/3` carry their
own `font-weight`, `line-height` and `letter-spacing`. Adding `font-bold`,
`leading-*` or `tracking-*` beside one **silently wins**: the generated rule is
`font-weight: var(--tw-font-weight, var(--text-display-1--font-weight))`, so a
stray `font-*` sets `--tw-font-weight` and beats the scale with no error
anywhere. UI text (≤17px) is not in this scale and keeps 600–800.

`display-1` is calibrated for a **full-width** title (11vw, up to 148px). It
needs the whole content column; in a half-width grid cell it sets 140px type in
a ~530px box. If a title must share its row, use `display-2`.

**The eyebrow states a claim.** `<SectionLabel variant="eyebrow">` is for
editorial surfaces and argues the section's position — "Stage first, family
next", not "Coverage". An eyebrow that merely names its section is a review
failure. `variant="accent"` (the default) stays the red overline for chrome:
device panels, dialogs, group headings.

**The blueprint frame never enters a component.** `<Blueprint>` marks the page
frame and section boundaries only — rows and cards must read as objects sitting
on a drafting table, not as a second grid. Mount it in a `relative` container
that **is** the column you want framed (it fills its container rather than
assuming a geometry: home centres 1080px, the app shell's `<main>` is 1100px
beside the rail). Pair with a `relative z-10` content wrapper — the frame is
`z-0`, not `-z-10`, because the parent usually carries `stage-backdrop` and a
negative index would hide the frame behind it. Use `variant="quiet"` on dense
tool surfaces.

**Tokens are tree-shaken.** Tailwind v4 only emits an `@theme` variable if a
utility actually uses it — a new token will be absent from the built CSS until
something consumes it. That is expected, not a bug (`--color-bg` and
`--color-devbox-bg` are absent for the same reason: they are used as `var(--bg)`
inside `@utility` blocks, not through a `bg-*` utility).
