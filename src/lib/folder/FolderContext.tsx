import { createContext, useContext, type ReactNode } from 'react';
import { useFolderLibrary, type FolderLibrary } from './useFolderLibrary';

/** The one linked-folder source, shared by every screen. Lifting the hook here
 *  replaces the four independent useFolderLibrary() instances (Library, Samples,
 *  Presets, Pianos) that each restored + scanned the folder separately. */
const Ctx = createContext<FolderLibrary | null>(null);

export function FolderProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useFolderLibrary()}>{children}</Ctx.Provider>;
}

export function useFolder(): FolderLibrary {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFolder must be used within FolderProvider');
  return v;
}
