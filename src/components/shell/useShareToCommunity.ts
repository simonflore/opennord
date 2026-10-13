import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { COMMUNITY_SHARE_TO } from './nav';

/**
 * Open the community share form on a library item. The form is a build-injected
 * route (hence the cast), and `?item=<id>` is how it knows which item to open on.
 * Whether sharing is offered for an item is the caller's decision.
 */
export function useShareToCommunity(): (id: string) => void {
  const navigate = useNavigate();
  return useCallback((id: string) => void navigate({ to: COMMUNITY_SHARE_TO, search: { item: id } as never }), [navigate]);
}
