import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { SamplesView } from '@/components/sample/SamplesView';
import { useLibraryState } from '@/lib/library/LibraryContext';

export const SamplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/samples',
  component: SamplesScreen,
});

function SamplesScreen() {
  const { folder } = useLibraryState();
  return <SamplesView samples={folder.result.samples} />;
}
