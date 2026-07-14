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

**Never** put a raw hex in a component. New colors go in `tokens.css` + `@theme`.
Instrument visuals (dials/LCD/drawbars/waveform) stay in `nord.css`.
