import { User, Building2, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserEmailDisplay } from "./UserEmailDisplay";
import { formatLongDate } from "@/lib/utils/date";
import type { UserInfoCardProps } from "@/lib/settings/types";

/**
 * UserInfoCard - Karta wyświetlająca podstawowe informacje o zalogowanym użytkowniku
 *
 * Komponent prezentuje szczegółowe informacje o koncie użytkownika:
 * - Adres e-mail z możliwością kopiowania (UserEmailDisplay)
 * - UUID użytkownika
 * - Nazwa firmy i UUID firmy
 * - Data utworzenia konta
 *
 * Obsługuje stan ładowania poprzez wyświetlanie szkieletów.
 * Wszystkie UUID są wyświetlane w formacie mono dla łatwiejszego odczytu.
 *
 * @param props - Props komponentu
 * @param props.user - Dane użytkownika (UserDTO)
 * @param props.company - Dane firmy użytkownika (CompanyDTO)
 * @param props.email - Adres e-mail z Supabase Auth
 * @param props.isLoading - Opcjonalna flaga stanu ładowania
 *
 * @example
 * ```tsx
 * <UserInfoCard
 *   user={userData}
 *   company={companyData}
 *   email="user@example.com"
 *   isLoading={false}
 * />
 * ```
 */
export function UserInfoCard({ user, company, email, isLoading = false }: UserInfoCardProps) {
  // Stan ładowania - wyświetl szkielety
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Informacje o koncie</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // Formatuj datę utworzenia konta
  const accountCreatedDate = formatLongDate(user.createdAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Informacje o koncie</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adres e-mail z możliwością kopiowania */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Adres e-mail</div>
          <UserEmailDisplay email={email} />
        </div>

        {/* UUID użytkownika */}
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">ID użytkownika</div>
          <p className="text-xs font-mono text-foreground break-all bg-muted px-2 py-1 rounded">{user.uuid}</p>
        </div>

        {/* Nazwa firmy */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Firma</span>
          </div>
          <p className="text-sm pl-6">{company.name}</p>
        </div>

        {/* UUID firmy */}
        <div className="space-y-1 pl-6">
          <div className="text-xs font-medium text-muted-foreground">ID firmy</div>
          <p className="text-xs font-mono text-foreground break-all bg-muted px-2 py-1 rounded">{company.uuid}</p>
        </div>

        {/* Data utworzenia konta */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Konto utworzone: {accountCreatedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
