import { LogOut, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { LogoutButtonProps } from "@/lib/settings/types";

/**
 * LogoutButton - Przycisk wylogowania z potwierdzeniem w AlertDialog
 * 
 * Komponent zapewnia bezpieczne wylogowanie użytkownika z aplikacji
 * z wymogiem potwierdzenia akcji w dialogu. Zabezpiecza przed przypadkowym
 * wylogowaniem i informuje użytkownika o konsekwencjach akcji.
 * 
 * Funkcjonalność:
 * - Przycisk główny otwiera dialog potwierdzenia
 * - Dialog zawiera jasny komunikat o konsekwencjach
 * - Użytkownik może anulować lub potwierdzić akcję
 * - Stan ładowania podczas procesu wylogowania
 * - Przycisk jest wyłączony podczas wylogowania
 * - Focus trap w dialogu dla accessibility
 * 
 * @param props - Props komponentu
 * @param props.onSignOut - Async funkcja wylogowania
 * @param props.isLoading - Flaga stanu wylogowania (disabled + loading indicator)
 * @param props.variant - Wariant wizualny przycisku (domyślnie 'destructive')
 * 
 * @example
 * ```tsx
 * const [isSigningOut, setIsSigningOut] = useState(false);
 * 
 * const handleSignOut = async () => {
 *   setIsSigningOut(true);
 *   await signOut();
 * };
 * 
 * <LogoutButton 
 *   onSignOut={handleSignOut}
 *   isLoading={isSigningOut}
 *   variant="destructive"
 * />
 * ```
 */
export function LogoutButton({ 
  onSignOut, 
  isLoading, 
  variant = 'destructive' 
}: LogoutButtonProps) {
  /**
   * Obsługuje kliknięcie przycisku potwierdzenia w dialogu
   */
  const handleConfirmSignOut = async () => {
    await onSignOut();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          disabled={isLoading}
          aria-label="Wyloguj się z aplikacji"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Wylogowywanie...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Wyloguj</span>
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz się wylogować?</AlertDialogTitle>
          <AlertDialogDescription>
            Zostaniesz przekierowany na stronę logowania. 
            Aktualna sesja zostanie zakończona i będziesz musiał zalogować się ponownie, 
            aby uzyskać dostęp do aplikacji.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmSignOut}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Wylogowywanie...</span>
              </>
            ) : (
              'Wyloguj'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


