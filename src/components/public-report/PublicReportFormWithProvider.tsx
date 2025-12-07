import { QueryProvider } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import { PublicReportForm } from './PublicReportForm';

interface PublicReportFormWithProviderProps {
  token: string;
}

/**
 * Wrapper component that provides QueryClient context to PublicReportForm
 * This is needed because Astro's client:only directive doesn't preserve React context
 */
export function PublicReportFormWithProvider({ token }: PublicReportFormWithProviderProps) {
  return (
    <QueryProvider>
      <PublicReportForm token={token} />
      <Toaster />
    </QueryProvider>
  );
}


