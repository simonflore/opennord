# Tailwind ↔ token cheatsheet (Studio Dark)

Use utilities for chrome; keep `nord.css` + composite tokens as CSS.

| Want | Utility | (was) |
|---|---|---|
| surface bg | `bg-surface` | `background: var(--surface)` |
| sunken input/rail | `bg-sink` | `var(--sink)` |
| hairline border | `border border-line` | `1px solid var(--line)` |
| primary text | `text-ink` | `var(--ink)` |
| dim/muted text | `text-dim` / `text-muted` | `var(--dim)/(--muted)` |
| red accent | `bg-red text-text-on-accent` | `var(--red)` |
| radius | `rounded-sm/md/lg` | `var(--r-sm/md/lg)` |
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
| `fill-primary` | red gradient | primary CTA fills |
| `edge-hi` | top bevel highlight | — |
| `elev-1` / `elev-2` / `elev-3` | edge-hi + shadow-1/2, or shadow-3 | resting / raised / floating |
| `inset-1` | recessed shadow | pressed, sunken inputs |
| `glow` / `glow-hi` | red halo (+ shadow-2) | primary affordance / its hover |

**Pattern (the Button is the reference):** `cva` for variants + `cn()` to merge;
raw utilities for layout/spacing/color; the vocabulary above for composites.
Interactive primitives (Dialog, Menu, Tabs, Toast, Tooltip, Select) → Radix,
copied-in shadcn-style, styled with these utilities.

**Never** put a raw hex in a component. New colors go in `tokens.css` + `@theme`;
new composite treatments go in the `@utility` block in tokens.css.
Instrument visuals (dials/LCD/drawbars/waveform) stay in `nord.css`.
