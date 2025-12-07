import { QueryProvider } from "@/lib/query-client";
import { ErrorBoundary } from "./ErrorBoundary";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileLayout } from "./MobileLayout";
import { NetworkIndicator } from "./NetworkIndicator";
import { OfflineFallback } from "./OfflineFallback";
import { Breadcrumbs } from "./Breadcrumbs";
import { useAuthContext } from "@/lib/layout/useAuthContext";
import { useActiveRoute } from "@/lib/layout/useActiveRoute";
import { useNetworkStatus } from "@/lib/layout/useNetworkStatus";
import { Toaster } from "sonner";

interface LayoutContentProps {
  /** Page content to display */
  children: React.ReactNode;
}

/**
 * LayoutContent component
 *
 * Main layout component that:
 * - Manages user and company data via useAuthContext
 * - Monitors network status
 * - Renders Desktop Sidebar OR Mobile Layout based on viewport
 * - Shows loading skeleton while data is loading
 * - Shows error state with retry option
 * - Displays offline banner when offline
 *
 * Wraps everything in ErrorBoundary and QueryProvider.
 *
 * @param props - LayoutContent props
 * @returns Main layout component
 */
export function LayoutContent({ children }: LayoutContentProps) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <LayoutContentInner>{children}</LayoutContentInner>
      </ErrorBoundary>
    </QueryProvider>
  );
}

/**
 * Inner component that uses hooks
 * Separated to ensure QueryProvider is available
 */
function LayoutContentInner({ children }: LayoutContentProps) {
  const { user, company, isLoading, error, signOut, refresh } = useAuthContext();
  const { pathname, pageTitle, breadcrumbs } = useActiveRoute();
  const { isOnline } = useNetworkStatus();

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <>
        <div className="flex min-h-screen">
          {/* Desktop skeleton */}
          <div className="hidden md:block">
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 animate-pulse border-r border-border bg-muted/20" />
          </div>

          {/* Mobile skeleton */}
          <div className="md:hidden">
            <header className="sticky top-0 z-30 h-16 animate-pulse border-b border-border bg-muted/20" />
          </div>

          {/* Content skeleton */}
          <main className="flex-1 md:ml-64">
            <div className="container mx-auto space-y-4 p-6">
              <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // Error state (non-401 errors, as 401 triggers auto-redirect)
  if (error) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <OfflineFallback onRetry={refresh} />
          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // Data not loaded yet (shouldn't happen, but safety check)
  if (!user || !company) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-medium">Ładowanie...</div>
          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // Authenticated state - render layout
  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop view - Sidebar + Content */}
        <div className="hidden md:block">
          <DesktopSidebar
            companyName={company.name}
            activeRoute={pathname}
            user={user}
            company={company}
            onSignOut={signOut}
          />
        </div>

        {/* Main content area (desktop) */}
        <main className="hidden flex-1 flex-col md:ml-64 md:flex">
          {/* Offline banner */}
          {!isOnline && (
            <div className="p-4">
              <OfflineFallback onRetry={refresh} />
            </div>
          )}

          {/* Breadcrumbs and network indicator */}
          <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex items-center justify-between px-6 py-3">
              <Breadcrumbs crumbs={breadcrumbs} />
              <NetworkIndicator />
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1">{children}</div>
        </main>

        {/* Mobile view - wrapped in MobileLayout */}
        <div className="md:hidden flex-1">
          <MobileLayout
            pageTitle={pageTitle}
            activeRoute={pathname}
            companyName={company.name}
            user={user}
            company={company}
            onSignOut={signOut}
          >
            {/* Offline banner */}
            {!isOnline && (
              <div className="p-4">
                <OfflineFallback onRetry={refresh} />
              </div>
            )}

            {/* Page content */}
            {children}
          </MobileLayout>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
