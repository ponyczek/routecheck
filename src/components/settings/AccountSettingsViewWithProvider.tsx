import { QueryProvider } from "@/lib/query-client";
import { AccountSettingsView } from "./AccountSettingsView";
import type { AccountSettingsViewProps } from "@/lib/settings/types";

/**
 * AccountSettingsViewWithProvider - Wrapper dla AccountSettingsView z QueryProvider
 * 
 * Ten komponent jest niezbędny gdy widok jest używany jako React island w Astro (client:load),
 * ponieważ tworzy osobne drzewo React wymagające własnego kontekstu React Query.
 * 
 * Wrapper:
 * - Dostarcza QueryClientProvider dla całego drzewa komponentów
 * - Przekazuje wszystkie propsy do AccountSettingsView
 * - Umożliwia działanie useQuery hooks w komponentach potomnych
 * 
 * Uwaga: W Astro każdy React island potrzebuje własnego QueryProvider,
 * ponieważ islands są izolowanymi drzewami React.
 * 
 * @param props - Props przekazywane do AccountSettingsView
 * @param props.initialUser - Opcjonalne początkowe dane użytkownika (server-side)
 * @param props.initialSession - Opcjonalne początkowe dane sesji (server-side)
 * 
 * @example
 * W pliku Astro (.astro):
 * ```astro
 * ---
 * import { AccountSettingsViewWithProvider } from '@/components/settings';
 * 
 * // Opcjonalnie: server-side fetch
 * const user = await fetchCurrentUserFromAPI();
 * ---
 * 
 * <AccountSettingsViewWithProvider 
 *   client:load 
 *   initialUser={user}
 * />
 * ```
 */
export function AccountSettingsViewWithProvider(props: AccountSettingsViewProps) {
  return (
    <QueryProvider>
      <AccountSettingsView {...props} />
    </QueryProvider>
  );
}


