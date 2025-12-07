import { Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LogoutButton } from "./LogoutButton";
import type { AccountActionsCardProps } from "@/lib/settings/types";

/**
 * AccountActionsCard - Karta z akcjami związanymi z kontem użytkownika
 *
 * Komponent zawiera główne akcje, które użytkownik może wykonać na swoim koncie:
 * - Wylogowanie z aplikacji (LogoutButton)
 * - Potencjalnie w przyszłości: zmiana hasła, usunięcie konta, itp.
 *
 * Karta deleguje obsługę akcji do komponentów potomnych i zarządza
 * wspólnym stanem ładowania dla wszystkich akcji.
 *
 * @param props - Props komponentu
 * @param props.onSignOut - Async callback wywoływany podczas wylogowania
 * @param props.isSigningOut - Flaga procesu wylogowania (używana do disabled state)
 *
 * @example
 * ```tsx
 * const [isSigningOut, setIsSigningOut] = useState(false);
 *
 * const handleSignOut = async () => {
 *   setIsSigningOut(true);
 *   try {
 *     await signOut();
 *   } finally {
 *     setIsSigningOut(false);
 *   }
 * };
 *
 * <AccountActionsCard
 *   onSignOut={handleSignOut}
 *   isSigningOut={isSigningOut}
 * />
 * ```
 */
export function AccountActionsCard({ onSignOut, isSigningOut }: AccountActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <CardTitle>Akcje konta</CardTitle>
            <CardDescription>Zarządzaj swoim kontem i sesjami</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sekcja wylogowania */}
        <div className="space-y-2">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Wylogowanie</h4>
            <p className="text-xs text-muted-foreground">
              Zakończ bieżącą sesję i wyloguj się z aplikacji. Będziesz musiał zalogować się ponownie, aby uzyskać
              dostęp.
            </p>
          </div>
          <LogoutButton onSignOut={onSignOut} isLoading={isSigningOut} variant="destructive" />
        </div>

        {/* Placeholder na przyszłe akcje */}
        {/* 
        <div className="pt-4 border-t space-y-2">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Zmiana hasła</h4>
            <p className="text-xs text-muted-foreground">
              Zmień hasło dostępu do swojego konta
            </p>
          </div>
          <Button variant="outline" disabled>
            Zmień hasło
          </Button>
        </div>
        */}
      </CardContent>
    </Card>
  );
}
