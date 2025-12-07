import { QueryProvider } from "@/lib/query-client";
import { CompanyProfileView, type CompanyProfileViewProps } from "./CompanyProfileView";

/**
 * CompanyProfileViewWithProvider - Wrapper for CompanyProfileView with QueryClientProvider
 *
 * This wrapper is needed when CompanyProfileView is used as an Astro island (client:load)
 * because it creates a separate React tree that needs its own QueryClientProvider.
 *
 * Usage in Astro:
 * ```astro
 * <CompanyProfileViewWithProvider client:load initialCompany={company} />
 * ```
 */
export function CompanyProfileViewWithProvider(props: CompanyProfileViewProps) {
  return (
    <QueryProvider>
      <CompanyProfileView {...props} />
    </QueryProvider>
  );
}
