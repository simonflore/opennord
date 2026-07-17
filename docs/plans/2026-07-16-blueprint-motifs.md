# Blueprint Motifs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Studio Dark with a display type scale (weight follows size), a monospace eyebrow label, and a dashed blueprint frame — validated on one editorial screen and one dense tool screen.

**Architecture:** Three token additions in `tokens.css` drive everything. The eyebrow ships as a `cva` variant on the **existing** `SectionLabel` primitive (not a new component). The blueprint frame is a decorative overlay that draws rails at **its container's edges**, so it inherits whatever column it is mounted in. HomeView is split along its existing comment-banner seams first (pure refactor), then restyled.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind v4 (`@theme` + `@utility`), `class-variance-authority` ^0.7.1, vitest + `renderToStaticMarkup`.

## Global Constraints

- **Never write a raw hex in a component.** New colors go in `tokens.css` `@theme`. Stylelint enforces this and will fail the build.
- **Palette is unchanged.** Dark-only, single `--red` accent. Do not introduce decorative color — `--warn`/`--connected`/`--lcd-cyan`/`--focus` are semantic status colors and must keep their meaning.
- **Blueprint invariant:** the frame marks the page frame and section boundaries only. It **never** enters a component's interior.
- **Weight follows size:** thin (300) only at display sizes; UI text (≤17px) keeps 600–800.
- **Mobile-first.** Every clamp() must be checked at phone width. `npm run dev` and test narrow first.
- **CI gates:** `npm run typecheck`, `npm run lint`, `npm test` must all pass before every commit.
- Path alias `@/` → `src/`. All work is in `packages/core`.
- Run all commands from `/Users/simonflore/Code/opennord-backend/packages/core`.

---

## Deviations from the spec (resolved here)

The spec was written before reading the component tree. Three of its assumptions were false; this plan supersedes them:

1. **Spec §4 said create `src/components/ui/Eyebrow.tsx`.** `SectionLabel.tsx` already exists and already is an eyebrow (`text-[9px] font-bold uppercase tracking-[1.4px] text-red-bright`), used in 9 places across HomeView, ConnectPanel, and ConvertToStage4. A second eyebrow component would be a near-duplicate. **Task 2 adds a `cva` variant instead**, keeping all 9 existing call sites byte-identical.
2. **Spec §6 said LibraryView gets "an eyebrow + title at `display-3`".** LibraryView has no `<h1>` — no app screen does; the rail is the wayfinding. Adding a page title is a product change, not a restyle, and it costs vertical space on a working surface. **Task 6 mounts the frame only.** The slice's actual question — does the grid survive density? — does not need a title.
3. **Spec §5 implied a single column geometry.** HomeView centers `max-w-[1080px]`; the app shell's `<main>` is `max-w-[1100px]` sitting beside a rail, so it is not viewport-centered. A Blueprint that assumed a centered column would misalign on every app screen. **Blueprint draws rails at its container's edges** and is mounted inside a container that *is* the column.

---

## File Structure

**Create:**
- `src/components/ui/Blueprint.tsx` — the decorative frame + crosshairs
- `src/components/home/layout.ts` — `CONTENT`, `SEC`, `SEC_TIGHT` (shared by every section)
- `src/components/home/icons.tsx` — the 12 line icons (currently 136 lines inside HomeView)
- `src/components/home/SectionHead.tsx` — shared section heading
- `src/components/home/SiteHeader.tsx`, `Hero.tsx`, `Features.tsx`, `More.tsx`, `DesktopApp.tsx`, `Proof.tsx`, `Coverage.tsx`, `Matrix.tsx`, `Why.tsx`, `OpenSource.tsx`, `SiteFooter.tsx`

**Modify:**
- `src/styles/tokens.css` — `@theme` gains the display scale, `--color-grid`, `--container-content`
- `src/components/ui/SectionLabel.tsx` — gains the `eyebrow` cva variant
- `src/components/ui/index.ts` — export `Blueprint`
- `src/components/ui/ui.test.tsx` — tests for both
- `src/components/home/HomeView.tsx` — 836 lines → composition root only
- `src/components/library/LibrarySplit.tsx` — mounts the frame
- `src/styles/tailwind-baseline.md`, `packages/core/CLAUDE.md` — docs

---

### Task 1: Tokens — display scale, grid color, content column

**Files:**
- Modify: `src/styles/tokens.css:18-46` (the `@theme` block)

**Interfaces:**
- Consumes: nothing.
- Produces: utilities `text-display-1`, `text-display-2`, `text-display-3`, `border-grid`, `bg-grid`, `max-w-content`; custom properties `--text-display-*`, `--color-grid`, `--container-content`.

Tailwind v4 lets a font-size token carry its own weight/leading/tracking as `--text-<name>--<property>` modifiers. That is the whole point of doing it this way: a component **cannot** pick up `text-display-1` without also picking up weight 300 and leading 0.92, so "weight follows size" is enforced by the token system rather than by reviewer memory.

- [ ] **Step 1: Add the display scale to the `@theme` block**

Insert immediately after the `--font-mono` line in `src/styles/tokens.css` (currently line 42), inside `@theme`:

```css
  /* ── Display scale — weight follows size ───────────────────────────────────
     The weight/leading/tracking travel WITH the size token, so a component
     cannot take a display size without its light weight. Thin only ever appears
     where it is big enough to stay legible on --bg. UI text (≤17px) is NOT in
     this scale and keeps its 600–800 weights.
     Weight 300 is the lightest real cut across SF Pro, Segoe UI, and Roboto.
     display-1 may drop to 200–250 on Apple after visual review. */
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

  /* The blueprint grid's own step. A dashed rule shows roughly half the ink of
     a solid one, and --line (#2b2f39) is already near threshold on --bg
     (#15171c), so the grid would vanish if it reused --line. */
  --color-grid: #343a47;

  /* The editorial content column. HomeView's CONTENT and the Blueprint frame
     both resolve to this, so they cannot drift apart. NOTE: the app shell's
     <main> (routes/root.tsx) is max-w-[1100px] and is deliberately NOT changed
     here — it sits beside the rail and is a different column. */
  --container-content: 1080px;
```

- [ ] **Step 2: Verify via a temporary probe**

**Tailwind v4 tree-shakes unused `@theme` variables** — a token with no utility consumer is simply not emitted. (Proof: `--color-bg` and `--color-devbox-bg` are long-standing correct tokens and are also absent from the built CSS, because they are consumed as `var(--bg)` inside `@utility` blocks rather than through a `bg-*` utility.) So these tokens **cannot** be verified standalone. Probe them instead.

Create `src/__tailwind-probe.tsx` (temporary — Tailwind scans source for class strings, so it does not need to be imported):

```tsx
// TEMPORARY probe — delete before commit.
export function TailwindProbe() {
  return (
    <div className="max-w-content border-grid bg-grid">
      <h1 className="text-display-1">probe</h1>
      <h2 className="text-display-2">probe</h2>
      <h3 className="text-display-3">probe</h3>
    </div>
  );
}
```

Run:
```bash
npm run build >/dev/null 2>&1
grep -o '\.text-display-1{[^}]*}' dist/assets/*.css
grep -o -- '--color-grid:[^;]*' dist/assets/*.css | head -1
grep -o -- '--container-content:[^;]*' dist/assets/*.css | head -1
```

Expected — the utility carries **all four** properties, and both tokens emit:
```
.text-display-1{font-size:var(--text-display-1);line-height:var(--tw-leading,var(--text-display-1--line-height));letter-spacing:var(--tw-tracking,var(--text-display-1--letter-spacing));font-weight:var(--tw-font-weight,var(--text-display-1--font-weight))}
--color-grid:#343a47
--container-content:1080px
```

**This resolves the plan's open risk:** `--text-*--font-weight` is supported, so the `font-light` fallback contemplated in Task 5 is not needed.

It also proves why "never override a display weight" is a hard rule rather than advice: the emitted `font-weight: var(--tw-font-weight, var(--text-display-1--font-weight))` means any `font-bold`/`font-extrabold` on the same element sets `--tw-font-weight` and **silently wins over the scale**. Stripping `font-extrabold` from the hero (Task 5 Step 2) is load-bearing.

Then delete the probe:

```bash
rm src/__tailwind-probe.tsx
```

- [ ] **Step 3: Confirm the gates are green**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0. Stylelint is the gate that proves `--color-grid` is a real token and not a stray hex.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(tokens): add display scale, grid color, content column

Weight/leading/tracking ride along with each display size token, so
weight-follows-size is enforced by the token system rather than by
convention. --color-grid gets its own step because a dashed rule at
--line is below threshold on --bg."
```

---

### Task 2: `SectionLabel` gains the eyebrow variant

**Files:**
- Modify: `src/components/ui/SectionLabel.tsx` (whole file)
- Test: `src/components/ui/ui.test.tsx:82-88` (extend the existing `describe`)

**Interfaces:**
- Consumes: `--font-mono`, `text-muted` (existing tokens); `cn` from `@/lib/cn`.
- Produces: `SectionLabel({ variant?: 'accent' | 'eyebrow', children })` and `sectionLabelVariants`. Default is `accent` — **byte-identical to today's output**, so all 9 existing call sites are unaffected.

`SectionLabel` already serves two jobs: editorial overlines on HomeView, and functional group headings in ConnectPanel (`Your Nord`) and ConvertToStage4. Only the first should become an eyebrow, so this is a variant axis, not a rewrite. This follows the `Button.tsx` house pattern exactly (cva + `cn`, variants object, exported variants fn).

- [ ] **Step 1: Write the failing tests**

Replace the `describe('SectionLabel', …)` block at `src/components/ui/ui.test.tsx:82-88` with:

```tsx
describe('SectionLabel', () => {
  it('renders uppercase overline text', () => {
    const html = renderToStaticMarkup(<SectionLabel>Surfaces</SectionLabel>);
    expect(html).toContain('Surfaces');
    expect(html).toContain('uppercase');
  });

  it('defaults to the red accent overline (the 9 existing call sites)', () => {
    const html = renderToStaticMarkup(<SectionLabel>Your Nord</SectionLabel>);
    expect(html).toContain('text-red-bright');
    expect(html).not.toContain('font-mono');
  });

  it('renders the eyebrow variant as muted monospace', () => {
    const html = renderToStaticMarkup(<SectionLabel variant="eyebrow">Stage first, family next</SectionLabel>);
    expect(html).toContain('font-mono');
    expect(html).toContain('text-muted');
    expect(html).not.toContain('text-red-bright');
  });

  it('gives the eyebrow a decorative bullet that screen readers skip', () => {
    const html = renderToStaticMarkup(<SectionLabel variant="eyebrow">Hardware optional</SectionLabel>);
    expect(html).toContain('aria-hidden="true"');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/ui/ui.test.tsx -t SectionLabel`
Expected: FAIL — the eyebrow tests fail because `variant` is not a prop yet and the output has no `font-mono`. The first two tests PASS already (that is the point — they pin the existing behavior).

- [ ] **Step 3: Implement the variant**

Replace the entire contents of `src/components/ui/SectionLabel.tsx` with:

```tsx
import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The overline above a section/group heading.
 *
 * `accent` (the default) is the red overline used throughout the app's chrome —
 * device panels, dialogs, group headings. `eyebrow` is the editorial variant:
 * monospace, muted, wide-tracked, with a bullet. Both stay uppercase.
 *
 * An eyebrow states its section's CLAIM, not its name — "Stage first, family
 * next", not "Coverage". An eyebrow that merely labels its section is a review
 * failure. See docs/specs/2026-07-16-blueprint-motifs-design.md §4.
 */
export const sectionLabelVariants = cva('uppercase', {
  variants: {
    variant: {
      accent: 'text-[9px] font-bold tracking-[1.4px] text-red-bright',
      eyebrow: 'flex items-center gap-2 font-mono text-[10px] font-medium tracking-[1.6px] text-muted',
    },
  },
  defaultVariants: { variant: 'accent' },
});

export function SectionLabel({
  variant,
  children,
}: { children: ReactNode } & VariantProps<typeof sectionLabelVariants>) {
  return (
    <div className={cn(sectionLabelVariants({ variant }))}>
      {variant === 'eyebrow' && (
        <span aria-hidden="true" className="inline-block h-1 w-1 shrink-0 rounded-full bg-muted" />
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/ui/ui.test.tsx -t SectionLabel`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify the 9 existing call sites are untouched**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green. `SectionLabel` is used in `HomeView.tsx` (×5), `ConnectPanel.tsx` (×2), `ConvertToStage4.tsx` (×1) — none pass `variant`, so all still render `accent`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/SectionLabel.tsx src/components/ui/ui.test.tsx
git commit -m "feat(ui): add the eyebrow variant to SectionLabel

SectionLabel already serves two jobs — editorial overlines on the landing
page, and functional group headings in device panels and dialogs. Only the
first becomes a monospace eyebrow, so this is a cva variant axis rather
than a rewrite. accent stays the default; all 9 existing call sites render
byte-identically."
```

---

### Task 3: The `Blueprint` frame

**Files:**
- Create: `src/components/ui/Blueprint.tsx`
- Modify: `src/components/ui/index.ts`
- Test: `src/components/ui/ui.test.tsx` (append a new `describe`)

**Interfaces:**
- Consumes: `--color-grid` from Task 1 (`border-grid`, `bg-grid`); `cn` from `@/lib/cn`.
- Produces: `Blueprint({ variant?: 'full' | 'quiet' })` and `blueprintVariants`. Mount it as the first child of a `relative` container that **is** the column being framed; it draws rails at that container's edges and fills it.

**Why rails-at-container-edges and not a centered column:** HomeView centers a 1080px column on the viewport, while the app shell's `<main>` is 1100px sitting beside the rail. A frame that hardcoded either geometry would misalign on the other. Filling the container makes the frame correct on both, and makes the mount point the single place that decides geometry.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/ui/ui.test.tsx`, and add `import { Blueprint } from './Blueprint';` to the imports at the top:

```tsx
describe('Blueprint', () => {
  it('is decorative and inert — never in the a11y tree or the hit region', () => {
    const html = renderToStaticMarkup(<Blueprint />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events-none');
  });

  it('draws dashed rails at its container edges', () => {
    const html = renderToStaticMarkup(<Blueprint />);
    expect(html).toContain('border-dashed');
    expect(html).toContain('border-grid');
  });

  it('defaults to the full editorial frame', () => {
    const html = renderToStaticMarkup(<Blueprint />);
    expect(html).not.toContain('opacity-40');
  });

  it('drops back on dense tool surfaces via the quiet variant', () => {
    const html = renderToStaticMarkup(<Blueprint variant="quiet" />);
    expect(html).toContain('opacity-40');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/ui/ui.test.tsx -t Blueprint`
Expected: FAIL — `Cannot find module './Blueprint'`.

- [ ] **Step 3: Implement `Blueprint`**

Create `src/components/ui/Blueprint.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The blueprint frame: dashed rails at the content column's edges, with
 * crosshairs at the corners. Reads as a technical drawing of the instrument —
 * on-brand for a tool whose whole premise is that the format was mapped.
 *
 * INVARIANT (spec §5): the frame marks the PAGE FRAME and section boundaries
 * only. It NEVER enters a component's interior. Library rows and the device
 * slot grid must read as objects sitting on a drafting table, not as a second
 * grid competing with the first. This invariant is what makes an app-wide grid
 * safe; breaking it is what would make it noise.
 *
 * Mount as the first child of a `relative` container that IS the column you
 * want framed — the frame fills its container rather than assuming a viewport
 * geometry, because HomeView centers a 1080px column while the app shell's
 * <main> is 1100px beside the rail.
 *
 * Pair with a `relative z-10` wrapper around the real content: the frame sits
 * at z-0 so it cannot land behind the parent's own `stage-backdrop` background,
 * which is what a negative z-index would do.
 */
export const blueprintVariants = cva(
  'pointer-events-none absolute inset-0 z-0',
  {
    variants: {
      variant: {
        /** Editorial surfaces — home, about, contribute, compatibility. */
        full: '',
        /** Dense tool surfaces — library, device, dev. Lets patch density stay the subject. */
        quiet: 'opacity-40',
      },
    },
    defaultVariants: { variant: 'full' },
  },
);

/** A crosshair centred on a rail corner. */
function Crosshair({ side, edge }: { side: 'left' | 'right'; edge: 'top' | 'bottom' }) {
  return (
    <span
      className={cn(
        'absolute h-[9px] w-[9px]',
        side === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
        edge === 'top' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2',
      )}
    >
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-grid" />
      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-grid" />
    </span>
  );
}

export function Blueprint({ variant }: VariantProps<typeof blueprintVariants>) {
  return (
    <div className={cn(blueprintVariants({ variant }))} aria-hidden="true">
      <div className="relative h-full w-full border-x border-dashed border-grid">
        <Crosshair side="left" edge="top" />
        <Crosshair side="right" edge="top" />
        <Crosshair side="left" edge="bottom" />
        <Crosshair side="right" edge="bottom" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/ui/ui.test.tsx -t Blueprint`
Expected: PASS (4 tests).

- [ ] **Step 5: Export it**

Add to `src/components/ui/index.ts`, after the `SectionLabel` export line:

```ts
export { Blueprint, blueprintVariants } from './Blueprint';
```

- [ ] **Step 6: Confirm the gates**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Blueprint.tsx src/components/ui/index.ts src/components/ui/ui.test.tsx
git commit -m "feat(ui): add the Blueprint frame

Dashed rails at the container's edges with corner crosshairs. Fills its
container rather than assuming a geometry, because HomeView centres a
1080px column while the app shell's <main> is 1100px beside the rail.

Carries the invariant that makes an app-wide grid safe: the frame marks
the page frame only and never enters a component's interior."
```

---

### Task 4: Split HomeView along its existing seams

**Files:**
- Modify: `src/components/home/HomeView.tsx` (836 lines → ~40)
- Create: 14 files under `src/components/home/` (listed below)

**Interfaces:**
- Consumes: nothing new.
- Produces: one named export per file, matching the function name being moved. `layout.ts` produces `CONTENT`, `SEC`, `SEC_TIGHT`. `icons.tsx` produces `IconFile`, `IconLibrary`, `IconWave`, `IconUsb`, `IconConvert`, `IconBackup`, `IconCheck`, `IconSearch`, `IconDownload`, `IconDesktop`, `IconLock`, `IconApple`, `IconWindows`.

**This is a pure refactor. No visual change, no behavior change, no new code.** Do it before Task 5 so the restyle lands on small readable files and the review can separate "is the decomposition right?" from "is the design right?". The file already carries `/* ── X ── */` banners, so the seams are pre-drawn; move code **verbatim** and add only imports/exports.

- [ ] **Step 1: Establish the baseline**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green. Record that HomeView renders — every step below must keep this true.

- [ ] **Step 2: Extract the shared layout + style constants**

**The real dependency map** (verified by reading every section — the constants are *defined* inside one section's banner but *used* across several, so banner position does not imply ownership):

| Constant | Defined at | Actually used by |
|---|---|---|
| `CONTENT` | 8 | Hero, SiteHeader, SiteFooter, + `SEC`/`SEC_TIGHT` |
| `SEC` | 228 | Features, DesktopApp, Coverage, Matrix, Why, OpenSource |
| `SEC_TIGHT` | 229 | More, Proof |
| `scrollToSection` | 31 | SiteHeader only |
| `heroBtn` | 108 | Hero, **DesktopApp**, **OpenSource** |
| `iconTile` | 230 | Features, **Proof** |
| `roadmapTag` | 281 | More, **DesktopApp** |
| `covLink` | 332 | **Matrix**, DesktopApp |

Create `src/components/home/layout.ts` — the page's structural vocabulary:

```ts
import type { MouseEvent } from 'react';
import { cn } from '@/lib/cn';

/** The landing page's content column. Resolves to --container-content, which the
 *  Blueprint frame also uses — so the column and its rails cannot drift apart. */
export const CONTENT = 'mx-auto max-w-content px-6';
export const SEC = cn(CONTENT, 'py-[clamp(24px,6vw,72px)]');
export const SEC_TIGHT = cn(CONTENT, 'py-[clamp(16px,3vw,32px)]');

/**
 * Scroll to an in-page section without writing to the URL hash.
 *
 * The app uses hash-based routing (createHashHistory), so a bare
 * `href="#features"` is parsed by the router as the route `/features` — which
 * swaps this full-bleed landing page for the app shell (left rail). We keep the
 * href for accessibility and right-click, but intercept the click and scroll
 * manually so the router's hash is never touched.
 */
export function scrollToSection(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
}
```

Create `src/components/home/styles.ts` — the class strings shared across sections:

```ts
import { buttonVariants } from '@/components/ui';

/** The landing page's primary CTA. Hero, DesktopApp and OpenSource all use it. */
export const heroBtn = buttonVariants({ variant: 'primary', size: 'lg' });

/** The red-tinted icon tile. Features uses it at 40px; Proof overrides to 34px. */
export const iconTile = 'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--red)_22%,var(--line))] bg-[color-mix(in_srgb,var(--red)_12%,transparent)] text-red-bright';

/** The amber "not shipped yet" / "Alpha" marker. More and DesktopApp. */
export const roadmapTag = 'rounded-full border border-[color-mix(in_srgb,var(--warn)_45%,var(--line))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-warn';

/** The inline red link out to a fuller page. Matrix and DesktopApp. */
export const covLink = 'whitespace-nowrap text-xs font-semibold text-red-bright no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-red';
```

Note the one deliberate change: `max-w-[1080px]` → `max-w-content` (the Task 1 token). Same width, now shared with the Blueprint rails.

- [ ] **Step 3: Extract the icons**

Create `src/components/home/icons.tsx`. Move lines 700-836 verbatim (`svgProps` and all 13 `Icon*` functions). Add `export` to each `Icon*` function. Keep `svgProps` module-private (unexported).

- [ ] **Step 4: Extract `SectionHead`**

Create `src/components/home/SectionHead.tsx`. Move lines 688-698 verbatim, with `export`:

```tsx
import { SectionLabel } from '@/components/ui';

export function SectionHead({ overline, title, sub }: { overline: string; title: string; sub: string }) {
  return (
    <div className="mb-6 max-w-[40rem]">
      <SectionLabel>{overline}</SectionLabel>
      <h2 className="m-0 mt-2 font-extrabold leading-[1.15] tracking-[-0.6px] text-ink text-[clamp(22px,3.4vw,32px)]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.6] text-dim">{sub}</p>
    </div>
  );
}
```

- [ ] **Step 5: Extract each section to its own file**

One file per banner. Move the banner's constants **and** functions verbatim into the file; export only the section component named below; keep helpers module-private.

| Create | Move lines | Export | Keeps private |
|---|---|---|---|
| `SiteHeader.tsx` | 68-104 | `SiteHeader` | `navLink` |
| `Hero.tsx` | 110-191 | `Hero` | `HeroCard`, `DemoRow` |
| `Features.tsx` | 195-258 | `Features` | `FEATURES` |
| `More.tsx` | 262-322 | `More` | `MORE`, `moreItem`, `moreItemLink` |
| `DesktopApp.tsx` | 16-20, 324-375 | `DesktopApp` | `DESKTOP_VERSION`, `RELEASE_BASE`, `DOWNLOAD_MAC`, `DOWNLOAD_WIN`, `RELEASE_PAGE`, `archLabel` |
| `Proof.tsx` | 379-413 | `Proof` | `PROOF` |
| `Coverage.tsx` | 417-451 | `Coverage` | `READS_TODAY`, `MAPPED_NEXT`, `covChip`, `covChipOn` |
| `Matrix.tsx` | 455-567 | `Matrix` | `Cell`, `MATRIX_COLS`, `MATRIX`, `cellBase`, `CELL_META` |
| `Why.tsx` | 571-610 | `Why` | `WhyItem` |
| `OpenSource.tsx` | 614-643 | `OpenSource` | — |
| `SiteFooter.tsx` | 647-684 | `SiteFooter` | `footerLink` |

**Do not move the Step 2 shared constants into these files** — `heroBtn`, `iconTile`, `roadmapTag`, and `covLink` all have consumers in other sections despite being defined inside one section's banner. They go in `styles.ts`.

`DESKTOP_VERSION` / `RELEASE_BASE` / `DOWNLOAD_MAC` / `DOWNLOAD_WIN` / `RELEASE_PAGE` (lines 16-20) are used **only** by `DesktopApp` — `SiteFooter` links to GitHub and `/about`, not to any release URL. Keep them private to `DesktopApp.tsx`.

**`home.css` goes to `DesktopApp.tsx`.** It is down to a single rule, `.home-dl-glow` (a one-off corner glow), and `DesktopApp` at line 339 is its only consumer. Move `import './home.css';` off the composition root and onto `DesktopApp.tsx` — files that change together live together.

Each file imports what it needs from `@/components/ui`, `./layout`, `./styles`, `./icons`, `./SectionHead`.

- [ ] **Step 6: Reduce `HomeView.tsx` to the composition root**

`src/components/home/HomeView.tsx` becomes exactly this — note the `<main>` wrapper, with `SiteHeader` and `SiteFooter` **outside** it. That structure is load-bearing for accessibility and must survive the split verbatim:

```tsx
import { SiteHeader } from './SiteHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { More } from './More';
import { DesktopApp } from './DesktopApp';
import { Proof } from './Proof';
import { Coverage } from './Coverage';
import { Matrix } from './Matrix';
import { Why } from './Why';
import { OpenSource } from './OpenSource';
import { SiteFooter } from './SiteFooter';

/**
 * The public landing page — OpenNord's front door at `/`.
 *
 * Rendered full-bleed (outside the app's left rail; see routes/root.tsx) so the
 * initiative has a real marketing surface that explains what OpenNord is and
 * sends people into the app or to the source. Everything here routes through
 * tokens.css (Studio Dark) — no hardcoded color — and speaks the musician's
 * language, not the RE notes (docs/LEGAL.md requires the non-affiliation
 * disclaimer on every surface — it lives in the footer below).
 *
 * Composition only: each section owns its own file.
 */
export function HomeView() {
  return (
    <div className="min-h-screen stage-backdrop text-ink">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <More />
        <DesktopApp />
        <Proof />
        <Coverage />
        <Matrix />
        <Why />
        <OpenSource />
      </main>
      <SiteFooter />
    </div>
  );
}
```

The `import './home.css';` that was on line 1 does **not** come here — it moves to `DesktopApp.tsx` (Step 5).

- [ ] **Step 7: Verify nothing changed**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green, with no test edits. A pure refactor that needs a test change is not a pure refactor — stop and find what you altered.

Run: `npm run dev`, open the landing page, and confirm it is **visually identical** to before. Check phone width too.

- [ ] **Step 8: Commit**

```bash
git add src/components/home/
git commit -m "refactor(home): split HomeView into per-section files

836 lines to a ~40-line composition root plus one file per section, along
the comment-banner seams the file already carried. Pure move — no visual
or behavioral change. Lands before the restyle so review can separate the
decomposition from the design.

CONTENT now resolves to max-w-content (the --container-content token)
instead of a hardcoded 1080px, so the column and the Blueprint rails
share one source."
```

---

### Task 5: HomeView adopts the editorial register

**Files:**
- Modify: `src/components/home/HomeView.tsx`, `Hero.tsx`, `SectionHead.tsx`, `layout.ts`
- Modify: the 8 files whose `<SectionHead overline=…>` copy becomes a claim

**Interfaces:**
- Consumes: `text-display-1`/`text-display-2` (Task 1), `SectionLabel variant="eyebrow"` (Task 2), `Blueprint` (Task 3), `CONTENT` (Task 4).
- Produces: nothing new.

- [ ] **Step 1: Mount the frame in the composition root**

In `src/components/home/HomeView.tsx`, add `import { Blueprint } from '@/components/ui';` and wrap the sections. The frame needs an `absolute inset-0` box constrained to the column (`Blueprint` positions itself `absolute inset-0` **within** that box), and the content needs `relative z-10` so it paints above the `z-0` frame.

**Keep `<main>` and keep `SiteHeader`/`SiteFooter` outside it** — the `z-10` wrapper goes around all three, not inside `<main>`:

```tsx
export function HomeView() {
  return (
    <div className="relative min-h-screen stage-backdrop text-ink">
      <div className="absolute inset-0 mx-auto max-w-content">
        <Blueprint />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        <main>
          <Hero />
          <Features />
          <More />
          <DesktopApp />
          <Proof />
          <Coverage />
          <Matrix />
          <Why />
          <OpenSource />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
```

This is the geometry decision: the rails land at `max-w-content` (1080px, centered), which is exactly where `CONTENT` puts every section's edge. Both resolve to `--container-content`, so they cannot drift.

**Why `z-0` and not `-z-10`:** the parent div carries the `stage-backdrop` background. A negative z-index would paint the frame *behind* that background and make it invisible. The frame sits at `z-0` and the content is lifted to `z-10` instead.

- [ ] **Step 2: Take the hero to `display-1`**

In `src/components/home/Hero.tsx`, replace the `<h1>` className (originally `HomeView.tsx:121`):

```tsx
        <h1 className="m-0 mt-3 text-display-1 text-ink">
          Know your Nord — <span className="text-dim">without the keyboard.</span>
        </h1>
```

`font-extrabold leading-[1.05] tracking-[-1px] text-[clamp(30px,5.4vw,52px)]` all go: the size token now carries weight, leading, and tracking. Leaving any of them would silently override the scale — that is the failure this design prevents.

- [ ] **Step 3: Take section headings to `display-2` + eyebrow**

In `src/components/home/SectionHead.tsx`:

```tsx
export function SectionHead({ overline, title, sub }: { overline: string; title: string; sub: string }) {
  return (
    <div className="mb-6 max-w-[40rem]">
      <SectionLabel variant="eyebrow">{overline}</SectionLabel>
      <h2 className="m-0 mt-3 text-display-2 text-ink">{title}</h2>
      <p className="mt-4 text-[15px] leading-[1.6] text-dim">{sub}</p>
    </div>
  );
}
```

- [ ] **Step 4: Open the section rhythm**

In `src/components/home/layout.ts`:

```ts
export const SEC = cn(CONTENT, 'py-[clamp(64px,10vw,160px)]');
export const SEC_TIGHT = cn(CONTENT, 'py-[clamp(32px,5vw,80px)]');
```

Clamped low at phone width on purpose: the reference's whitespace is a desktop luxury, and unclamped on a phone it is just scrolling.

- [ ] **Step 5: Rewrite the overlines as claims**

An eyebrow states the section's position; it does not name it. Find every `<SectionHead overline="…">` and every direct `<SectionLabel>` in `src/components/home/`, and rewrite:

| Section | From (a label) | To (a claim) |
|---|---|---|
| Coverage | `Coverage` | `Stage first, family next` |
| Matrix | whatever names the table | `Read anywhere, transfer where it counts` |
| Proof | `Proof` | `Validated against real hardware` |
| Why | `Why` | `The keyboard is optional` |
| DesktopApp | `Desktop app` | `Where USB actually works` |
| More | `Also in the app` | *(keep — already reads as a claim)* |

Use these as the bar, not as gospel — the rule is that an eyebrow which merely names its section is a review failure. Keep the existing hero overline (`Open source · in your browser`); it already argues a position.

- [ ] **Step 6: Verify no call site overrides a display weight**

Task 1's probe already proved the utility emits all four properties, so the `font-light` fallback once contemplated here is **not needed**. The live risk is the opposite one: the emitted rule is `font-weight: var(--tw-font-weight, var(--text-display-1--font-weight))`, so a leftover `font-bold`/`font-extrabold` on the same element sets `--tw-font-weight` and **silently overrides the scale** — the hero would render heavy with no error anywhere.

Run:
```bash
grep -rn 'text-display-' src/components/home/
```
Expected: every hit is a `text-display-*` with **no** `font-*` weight, no `leading-*`, and no `tracking-*` on the same element. Any that has one is a bug — remove the override, not the token.

Then confirm the built output:
```bash
npm run build >/dev/null 2>&1 && grep -o -- '--text-display-1:[^;]*' dist/assets/*.css | head -1
```
Expected: `--text-display-1:clamp(3.5rem, 11vw, 9.25rem)`

- [ ] **Step 7: Verify visually — phone first**

Run: `npm run dev`

Check, in order:
1. **Phone width (375px).** The hero must not overflow; `clamp` floors at 56px. Section rhythm must not feel like dead scrolling.
2. **Desktop.** The hero reaches ~148px, thin. Rails land exactly on the section content edges — if they are 20px off, `CONTENT` and the frame have drifted and are not sharing `--container-content`.
3. **The frame is behind content**, not over it. Nothing is clipped; links still click (the frame is `pointer-events-none`).
4. **Crosshairs** sit centered on the rail corners.

- [ ] **Step 8: Check contrast**

In devtools, confirm the hero at weight 300 against `--bg`. `--ink` (#e9ebf0) on `--bg` (#15171c) is ~15:1, so it passes comfortably — confirm rather than assume, per the spec's "accessibility is part of precise". Check `text-muted` eyebrows too; they are the real risk at 10px.

If the eyebrow fails, move it from `text-muted` to `text-dim` — do not thin it further.

- [ ] **Step 9: Confirm the gates and commit**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green.

```bash
git add src/components/home/
git commit -m "feat(home): adopt the editorial register

Hero to display-1, section heads to display-2 + monospace eyebrows, the
blueprint frame at the content column, and a section rhythm that opens up
on desktop while staying clamped at phone width.

Overlines rewritten as claims rather than labels — 'Stage first, family
next', not 'Coverage'."
```

---

### Task 6: LibrarySplit adopts the frame — the experiment

**Files:**
- Modify: `src/components/library/LibrarySplit.tsx:51-61`

**Interfaces:**
- Consumes: `Blueprint` (Task 3).
- Produces: nothing.

**This task is the point of the whole slice.** Everything before it was guaranteed to work — home is spacious, so a frame was always going to look fine there. The open question the spec bet on is whether a blueprint frame survives behind real patch density. Answer it here, while retreating is still one file.

Per the deviations note above, there is **no title or eyebrow** in this task: LibraryView has no `<h1>`, no app screen does, and adding one is a product decision rather than a restyle.

- [ ] **Step 1: Mount the quiet frame**

In `src/components/library/LibrarySplit.tsx`, wrap the returned `CategorySplit`:

```tsx
  return (
    <div className="relative">
      <Blueprint variant="quiet" />
      <div className="relative z-10">
        <CategorySplit
          wide={wide}
          master={list}
          detail={program ?? <EmptyNote>Pick a program to see its details.</EmptyNote>}
          narrowDetail={program ?? <EmptyNote>This program isn’t open. Pick it from the Library.</EmptyNote>}
          hasDetail={!!selectedId}
          onBack={() => navigate({ to: '/library/programs' })}
          backLabel="← Library"
        />
      </div>
    </div>
  );
```

Add `import { Blueprint } from '@/components/ui';`.

The frame is mounted **here**, not in `routes/root.tsx`'s `<main>`, deliberately: `<main>` is shared by every app screen, and this slice only commits the Library. Mounting it in the shell would silently ship the grid to device, samples, compatibility, and dev before any of them have been looked at.

- [ ] **Step 2: Verify the gates**

Run: `npm test && npm run typecheck && npm run lint`
Expected: all green. `LibraryView.test.tsx` and `LibrarySplit.test.tsx` assert on roles and text, not class names (verified during planning), so a wrapper div does not disturb them.

- [ ] **Step 3: Make the call — does the grid survive density?**

Run: `npm run dev`, go to `/library/programs`, and **load a real folder with real patches**. An empty library proves nothing; the whole question is density.

Judge, honestly:
1. Do the rails read as a frame the rows sit inside, or as **noise competing with the rows**?
2. At phone width, where the split collapses to one pane — is the frame still calm?
3. With the detail pane open at wide width — does the frame fight the master/detail seam?
4. Is `opacity-40` right? Try `opacity-25` and `opacity-60` before deciding.

**This is a real gate with a real "no".** If the grid is noise, the correct outcome is to revert this task and scope the frame to editorial surfaces — home, about, contribute, compatibility. That is a **success**: the slice existed to find this out for the price of one file. Record the outcome either way in the spec's §6.

- [ ] **Step 4: Commit**

If it works:

```bash
git add src/components/library/LibrarySplit.tsx
git commit -m "feat(library): mount the blueprint frame on the dense register

The slice's actual experiment: whether a blueprint frame survives behind
real patch density. Quiet variant, frame-level only — the rows keep their
own visual language and read as objects on a drafting table.

Mounted on LibrarySplit rather than the shell's <main> so the grid does
not silently reach device/samples/compatibility before they are reviewed."
```

If it does not work:

```bash
git revert --no-commit HEAD 2>/dev/null || git checkout -- src/components/library/LibrarySplit.tsx
```

Then record the finding in `docs/specs/2026-07-16-blueprint-motifs-design.md` §6 and stop — Task 7 documents editorial-only scope instead.

---

### Task 7: Documentation

**Files:**
- Modify: `src/styles/tailwind-baseline.md`
- Modify: `packages/core/CLAUDE.md:168-224` (the Design Context)

**Interfaces:**
- Consumes: the outcome of Task 6.
- Produces: nothing.

- [ ] **Step 1: Extend the cheatsheet**

In `src/styles/tailwind-baseline.md`, add to the first table (after the `radius` row):

```markdown
| display type (weight follows size) | `text-display-1/2/3` | — |
| blueprint grid line | `border-grid` / `bg-grid` | `var(--color-grid)` |
| editorial content column | `max-w-content` | `max-w-[1080px]` |
```

And add below the composite-token table:

```markdown
**Display type — never override the weight.** `text-display-1/2/3` carry their
own `font-weight`, `line-height`, and `letter-spacing`. Adding `font-bold` or a
`leading-*` beside one defeats the scale: thin exists only where the size is
large enough to carry it. UI text (≤17px) is not in this scale and keeps 600–800.

**The eyebrow states a claim.** `<SectionLabel variant="eyebrow">` is for
editorial surfaces and should argue the section's position — "Stage first,
family next", not "Coverage". `variant="accent"` (default) stays the red
overline for chrome: device panels, dialogs, group headings.

**The blueprint frame never enters a component.** `<Blueprint>` marks the page
frame and section boundaries only. Mount it in a `relative` container that IS
the column; pair with a `relative z-10` content wrapper. Use `variant="quiet"`
on dense tool surfaces.
```

- [ ] **Step 2: Update the Design Context**

In `packages/core/CLAUDE.md`, in **Aesthetic Direction** (~line 195), append:

```markdown
The system also carries a **blueprint register**: monospace eyebrow labels and a
dashed content-column frame with crosshairs, reading as a technical drawing of
the instrument — on-brand for a tool whose premise is that the format was
mapped. Display type is **thin and large**; UI text stays bold and small
("weight follows size" — the display tokens carry their own weight, so the rule
is enforced by `tokens.css`, not by memory). Studio Dark's palette is unchanged:
the reference for this register (slashwork.com/roadmap) is a light, four-color
editorial page, and only its structure was taken. Decorative color stays out —
`--warn`/`--connected`/`--lcd-cyan`/`--focus` are semantic and must keep meaning.
Spec: `docs/specs/2026-07-16-blueprint-motifs-design.md`.
```

- [ ] **Step 3: Fix the stale spec reference**

The Design Context's last line currently reads:

```
Spec + plan: `docs/superpowers/{specs,plans}/2026-06-14-ui-redesign*`,
`docs/plans/2026-07-14-tailwind-migration.md`.
```

`docs/superpowers/` does not exist and no `ui-redesign` file exists anywhere in the repo — the doc governing all UI work points at a missing spec. Replace with:

```
Specs live in `docs/specs/`, plans in `docs/plans/`. Current:
`docs/specs/2026-07-16-blueprint-motifs-design.md` +
`docs/plans/2026-07-16-blueprint-motifs.md`, and
`docs/plans/2026-07-14-tailwind-migration.md`.
```

- [ ] **Step 4: Record the Task 6 outcome**

In `docs/specs/2026-07-16-blueprint-motifs-design.md` §6, append one line stating whether the grid survived the dense register, and the chosen `quiet` opacity. This is the slice's finding — it decides whether the remaining screens (about, contribute, compatibility, device, dev) get the frame.

- [ ] **Step 5: Verify links resolve**

Run:
```bash
ls docs/specs/2026-07-16-blueprint-motifs-design.md docs/plans/2026-07-16-blueprint-motifs.md docs/plans/2026-07-14-tailwind-migration.md
```
Expected: all three listed, no "No such file". This is the check whose absence produced the stale reference being fixed here.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tailwind-baseline.md CLAUDE.md ../../docs/specs/2026-07-16-blueprint-motifs-design.md
git commit -m "docs(design): document the blueprint register

Cheatsheet gains the display scale, grid line, and content column, plus the
three rules that keep them honest: never override a display weight, an
eyebrow states a claim, the frame never enters a component.

Also fixes a stale Design Context reference — it pointed at
docs/superpowers/{specs,plans}/2026-06-14-ui-redesign*, which does not
exist. Specs live in docs/specs/, plans in docs/plans/."
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 decisions (palette, weight-follows-size, system fonts) | Global Constraints; Task 1 |
| §2 what transfers | Tasks 2, 3, 5 (adopted); nothing implements the rejected rows, correctly |
| §3 display scale | Task 1 (tokens), Task 5 step 6 (verify all four properties) |
| §4 eyebrow primitive | Task 2 — **deviates**: variant on `SectionLabel`, not a new `Eyebrow` |
| §4 eyebrows-as-claims rule | Task 5 step 5; Task 7 step 1 |
| §5 `--color-grid` + Blueprint + invariant + quiet variant | Tasks 1, 3 |
| §5 stage-backdrop interaction | Task 5 step 7 (visual check) |
| §6 HomeView split | Task 4 |
| §6 HomeView restyle | Task 5 |
| §6 LibraryView | Task 6 — **deviates**: frame only, no title (none exists) |
| §7 CI gates, mobile-first, contrast | Every task; Task 5 steps 7-8 |
| §7 test class-name risk | Resolved during planning — library tests assert roles/text, not classes |
| §8 docs + stale reference | Task 7 |
| §9 out of scope | Task 6 step 1 mounts on LibrarySplit, not the shell, keeping device/dev/etc. out |

**Placeholder scan:** none. Every code step carries real code; the Task 4 moves cite exact line ranges rather than restating 836 lines verbatim.

**Type consistency:** `SectionLabel({ variant?, children })` in Task 2 matches the `variant="eyebrow"` usage in Task 5 step 3. `Blueprint({ variant? })` in Task 3 matches `<Blueprint />` (Task 5 step 1) and `<Blueprint variant="quiet" />` (Task 6 step 1). `CONTENT`/`SEC`/`SEC_TIGHT` produced by `layout.ts` in Task 4 step 2 match their consumers in Task 5 step 4. `--container-content` (Task 1) backs `max-w-content` in Task 4 step 2 and Task 5 step 1.

**Known open risk:** Task 5 step 6 is the first real proof that Tailwind v4 emits `--text-*--font-weight` into the generated utility. The step carries an explicit fallback (`font-light` at call sites) rather than assuming success.
