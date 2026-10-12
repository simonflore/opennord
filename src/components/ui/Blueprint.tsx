import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The blueprint frame: dashed rails at the content column's edges, with
 * crosshairs at the corners. Reads as a technical drawing of the instrument —
 * on-brand for a tool whose premise is that the format was mapped.
 *
 * INVARIANT: the frame marks the PAGE FRAME and section boundaries only. It
 * NEVER enters a component's interior. Library rows and the device slot grid
 * must read as objects sitting on a drafting table, not as a second grid
 * competing with the first. This invariant is what makes an app-wide grid safe;
 * breaking it is what would make it noise.
 * See docs/specs/2026-07-16-blueprint-motifs-design.md §5.
 *
 * Mount as the first child of a `relative` container that IS the column you want
 * framed — the frame fills its container rather than assuming a viewport
 * geometry, because HomeView centres a 1080px column while the app shell's
 * <main> is 1100px (1680px for the programs console) sitting beside the rail.
 *
 * Pair with a `relative z-10` wrapper around the real content. The frame sits at
 * z-0 deliberately: the parent typically carries the `stage-backdrop`
 * background, and a negative z-index would paint the frame behind that
 * background and make it invisible.
 */
export const blueprintVariants = cva('pointer-events-none absolute inset-0 z-0', {
  variants: {
    variant: {
      /** Editorial surfaces — home, about, contribute, compatibility. */
      full: '',
      /** Dense tool surfaces — library, device, dev. Lets patch density stay the subject. */
      quiet: 'opacity-40',
    },
  },
  defaultVariants: { variant: 'full' },
});

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
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-grid" />
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
