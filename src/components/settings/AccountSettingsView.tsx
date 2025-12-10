import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/layout/useAuthContext";
import { useSessionData } from "@/lib/settings/useSessionData";
import { SessionInfoCard } from "./SessionInfoCard";
import { UserInfoCard } from "./UserInfoCard";
import { SecurityTipsCard } from "./SecurityTipsCard";
import { AccountActionsCard } from "./AccountActionsCard";
import type { AccountSettingsViewProps } from "@/lib/settings/types";

/**
 * AccountSettingsView - Główny komponent widoku ustawień konta i sesji
 *
 * Komponent zarządza stanem sesji użytkownika, wyświetla informacje o koncie
 * oraz umożliwia wylogowanie. Wykorzystuje:
 * - useAuthContext do pobierania danych użytkownika i firmy
 * - useSessionData do pobierania danych sesji z Supabase Auth
 *
 * Struktura widoku:
 * - Nagłówek z tytułem i opisem
 * - SessionInfoCard - informacje o sesji
 * - UserInfoCard - informacje o koncie użytkownika
 * - SecurityTipsCard - porady bezpieczeństwa
 * - AccountActionsCard - akcje (wylogowanie)
 *
 * Obsługuje stany:
 * - Ładowanie danych (szkielety)
 * - Błędy API (komunikaty z możliwością retry)
 * - Brak danych użytkownika
 * - Proces wylogowania
 *
 * @param props - Props komponentu
 * @param props.initialUser - Opcjonalne początkowe dane użytkownika (server-side)
 * @param props.initialSession - Opcjonalne początkowe dane sesji (server-side)
 *
 * @example
 * ```tsx
 * <AccountSettingsView
 *   initialUser={userFromServer}
 *   initialSession={sessionFromServer}
 * />
 * ```
 */
export function AccountSettingsView({ initialSession }: AccountSettingsViewProps) {
  // Stan procesu wylogowania
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Pobierz dane użytkownika i firmy z AuthContext
  const { user, company, isLoading, error, signOut, refresh } = useAuthContext();

  // Pobierz dane sesji z Supabase Auth
  const { session, isLoading: isSessionLoading, error: sessionError } = useSessionData(initialSession);

  /**
   * Obsługuje wylogowanie użytkownika
   */
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Przekierowanie do /signin następuje w funkcji signOut
    } catch (error) {
      console.error("Sign out error:", error);
      // signOut zawsze przekierowuje, nawet przy błędzie
    } finally {
      // Ten kod może nigdy nie zostać wykonany z powodu przekierowania
      setIsSigningOut(false);
    }
  };

  // Stan ładowania - dane użytkownika lub sesji
  if (isLoading || isSessionLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Nagłówek */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Konto i sesja</h1>
            <p className="text-muted-foreground mt-2">Zarządzaj swoją sesją i bezpieczeństwem konta</p>
          </div>

          {/* Loading state */}
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ładowanie danych...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Błąd podczas pobierania danych użytkownika (nie 401)
  if (error && error.message !== "UNAUTHORIZED") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Konto i sesja</h1>
            <p className="text-muted-foreground mt-2">Zarządzaj swoją sesją i bezpieczeństwem konta</p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd ładowania danych</AlertTitle>
            <AlertDescription>
              {error.message === "NOT_FOUND"
                ? "Twoje konto nie zostało prawidłowo utworzone. Skontaktuj się z administratorem."
                : "Nie udało się pobrać danych konta. Spróbuj odświeżyć stronę."}
              <div className="mt-4 flex gap-2">
                <Button onClick={() => refresh()} size="sm">
                  Spróbuj ponownie
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Odśwież stronę
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Brak danych użytkownika (nie powinno się zdarzyć po przejściu middleware)
  if (!user || !company) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Konto i sesja</h1>
            <p className="text-muted-foreground mt-2">Zarządzaj swoją sesją i bezpieczeństwem konta</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Brak danych użytkownika</AlertTitle>
            <AlertDescription>
              Nie udało się załadować danych Twojego konta. Spróbuj odświeżyć stronę lub zalogować się ponownie.
              <div className="mt-4">
                <Button onClick={() => window.location.reload()} size="sm">
                  Odśwież stronę
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Główny widok - wszystko załadowane poprawnie
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Nagłówek */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Konto i sesja</h1>
          <p className="text-muted-foreground mt-2">Zarządzaj swoją sesją i bezpieczeństwem konta</p>
        </div>

        {/* Błąd sesji (nie krytyczny - pokazujemy resztę widoku) */}
        {sessionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nie udało się pobrać informacji o sesji</AlertTitle>
            <AlertDescription>
              {sessionError.message || "Wystąpił nieznany błąd podczas pobierania danych sesji."}
            </AlertDescription>
          </Alert>
        )}

        {/* Karta z informacjami o sesji */}
        {session && !sessionError && <SessionInfoCard session={session} isLoading={isSessionLoading} />}

        {/* Karta z informacjami o użytkowniku */}
        <UserInfoCard user={user} company={company} email={session?.email || "Brak danych"} isLoading={isLoading} />

        {/* Karta z poradami bezpieczeństwa */}
        <SecurityTipsCard companyName={company.name} />

        {/* Karta z akcjami konta */}
        <AccountActionsCard onSignOut={handleSignOut} isSigningOut={isSigningOut} />
      </div>
    </div>
  );
}
