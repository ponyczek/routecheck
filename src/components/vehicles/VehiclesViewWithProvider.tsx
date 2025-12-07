import { QueryProvider } from '@/lib/query-client';
import { VehiclesView } from './VehiclesView';
import { Toaster } from 'sonner';

/**
 * Wrapper dla VehiclesView z QueryClientProvider i Toaster
 * Używany w Astro page z client:only="react"
 */
export function VehiclesViewWithProvider() {
  return (
    <QueryProvider>
      <VehiclesView />
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}


