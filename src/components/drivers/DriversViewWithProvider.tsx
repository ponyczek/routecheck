import { QueryProvider } from '@/lib/query-client';
import { DriversView } from './DriversView';
import { Toaster } from 'sonner';

/**
 * Wrapper dla DriversView z QueryClientProvider i Toaster
 * Używany w Astro page z client:only="react"
 */
export function DriversViewWithProvider() {
  return (
    <QueryProvider>
      <DriversView />
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}



