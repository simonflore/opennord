import type { ReactNode } from 'react';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import type { Capabilities } from '@/lib/capabilities/types';
import { LockedFeature } from '@/components/ui/LockedFeature';

/** Renders `children` when `needs(capabilities)` is true, otherwise a locked
 *  upsell state. The single chokepoint for "visible-but-locked" cloud features. */
export function CapabilityGate({
  needs,
  title,
  blurb,
  children,
}: {
  needs: (c: Capabilities) => boolean;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  const caps = useCapabilities();
  return needs(caps) ? <>{children}</> : <LockedFeature title={title} blurb={blurb} />;
}
