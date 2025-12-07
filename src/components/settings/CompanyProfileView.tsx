import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "./PageHeader";
import { CompanyInfoCard } from "./CompanyInfoCard";
import { EditCompanyNameForm } from "./EditCompanyNameForm";
import { useCompany } from "@/lib/settings/queries";
import type { CompanyDTO } from "@/types";

export interface CompanyProfileViewProps {
  initialCompany: CompanyDTO;
}

/**
 * Główny komponent widoku profilu firmy
 * Zarządza stanem danych firmy poprzez TanStack Query
 * Wyświetla informacje o firmie i formularz edycji nazwy
 */
export function CompanyProfileView({ initialCompany }: CompanyProfileViewProps) {
  const { data: company, isLoading, error, refetch } = useCompany(initialCompany);

  // Użyj danych z cache lub initial data
  const displayCompany = company ?? initialCompany;

  // Nie pokazuj loading state jeśli mamy initialCompany
  const showLoading = isLoading && !initialCompany;

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl">
      <PageHeader
        title="Profil firmy"
        description="Zarządzaj podstawowymi danymi swojej firmy"
      />

      {/* Loading state */}
      {showLoading && <CompanyProfileSkeleton />}

      {/* Error state */}
      {error && !displayCompany && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd ładowania danych</AlertTitle>
          <AlertDescription>
            Nie udało się pobrać danych firmy.{" "}
            <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success state */}
      {displayCompany && !showLoading && (
        <>
          <CompanyInfoCard company={displayCompany} />
          <EditCompanyNameForm company={displayCompany} />
        </>
      )}
    </div>
  );
}

/**
 * Skeleton loader dla widoku profilu firmy
 */
function CompanyProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Card skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>

      {/* Form skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}


