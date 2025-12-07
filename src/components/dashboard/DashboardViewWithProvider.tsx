import { QueryProvider } from "@/lib/query-client";
import { DashboardView, type DashboardViewProps } from "./DashboardView";

/**
 * DashboardViewWithProvider - Wrapper for DashboardView with QueryClientProvider
 *
 * This wrapper is needed when DashboardView is used as an Astro island (client:load)
 * because it creates a separate React tree that needs its own QueryClientProvider.
 *
 * Usage in Astro:
 * ```astro
 * <DashboardViewWithProvider client:load timezone={timezone} />
 * ```
 */
export function DashboardViewWithProvider(props: DashboardViewProps) {
  return (
    <QueryProvider>
      <DashboardView {...props} />
    </QueryProvider>
  );
}
