import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Capabilities } from './types';
import { localCapabilities } from './defaults';

// Default value = local defaults, so useCapabilities() works even with no provider
// (the free build never wraps the tree). The product build wraps with real impls.
const Ctx = createContext<Capabilities>(localCapabilities);

export function CapabilitiesProvider({
  value,
  children,
}: {
  value?: Partial<Capabilities>;
  children: ReactNode;
}) {
  const merged = useMemo<Capabilities>(() => ({ ...localCapabilities, ...value }), [value]);
  return <Ctx.Provider value={merged}>{children}</Ctx.Provider>;
}

export function useCapabilities(): Capabilities {
  return useContext(Ctx);
}
