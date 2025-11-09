# Plan implementacji widoku Panel logowania

## 1. Przegląd
Widok odpowiada za uwierzytelnienie spedytora. Udostępnia formularz logowania z walidacją, integruje się z Supabase Auth i po udanym logowaniu przekierowuje użytkownika do `Dashboard`. Obsługuje komunikaty o błędach, informuje o wygaśnięciu sesji i zapobiega dostępowi do widoku przy aktywnej sesji.

## 2. Routing widoku
- Ścieżka: `/signin` jako strona publiczna poza `AuthenticatedLayout`.
- Middleware nie wymaga autoryzacji, ale przy aktywnej sesji następuje client-side redirect do docelowej trasy (`/dashboard` lub `returnTo`).
- Query param `returnTo` wspiera redirect po udanym logowaniu.

## 3. Struktura komponentów
- `SignInPage` (Astro) → root strony, ładuje layout publiczny i montuje wyspę React.
- `SignInHero` (Astro/React statyczny) → sekcja opisowa/brandingowa.
- `SignInFormCard` (React) → kontener formularza (`Card` z shadcn/ui).
  - `SessionExpiryNotice`
  - `SignInForm`
    - pola `EmailField`, `PasswordField`
    - `SubmitButton`
  - `AuthErrorAlert`
  - `SignInFooterLinks`

## 4. Szczegóły komponentów
### SignInPage
- Opis komponentu: Strona Astro renderująca layout publiczny, przekazująca parametry (`returnTo`, `expired`) do wyspy React oraz ustawiająca metadane SEO.
- Główne elementy: znacznik `<main>` z kontenerem `max-w-lg`, sekcja hero, slot na kartę formularza.
- Obsługiwane interakcje: brak interakcji (delegowane do dzieci); SSR redirect jeśli żądanie ma aktywną sesję (opcjonalnie, gdy zapewnimy helper).
- Obsługiwana walidacja: walidacja query paramów (`returnTo` ograniczona do ścieżek aplikacji, `expired` jako boolean).
- Typy: `SignInPageProps` { returnTo?: string; expired?: boolean }.
- Propsy: brak (Astro strona).

### SignInFormCard
- Opis komponentu: Kompozycja `Card`, która buduje strukturę formularza, zarządza stanem błędów globalnych i dostarcza kontekst dla formularza.
- Główne elementy: `CardHeader` z tytułem i opisem, `CardContent` z `SignInForm`, `SessionExpiryNotice`, `AuthErrorAlert`, `CardFooter` z `SignInFooterLinks`.
- Obsługiwane interakcje: przekazuje callback `onSuccess` i `onError` do formularza, renderuje spinnery w oparciu o `status`.
- Obsługiwana walidacja: brak dodatkowej walidacji (deleguje do formularza).
- Typy: `SignInStatus`, `AuthErrorState`.
- Propsy: `{ returnTo?: string; sessionExpiryReason?: SessionExpiryReason }`.

### SessionExpiryNotice
- Opis komponentu: Baner informujący o powodzie powrotu na stronę logowania (np. sesja wygasła).
- Główne elementy: `Alert` z ikoną, tekstem i opcjonalnym linkiem do pomocy.
- Obsługiwane interakcje: możliwość zamknięcia banera (ustawienie w stanie lokalnym, jeśli wprowadzimy `dismissible`).
- Obsługiwana walidacja: wymaga przekazania `sessionExpiryReason` z ograniczonej listy wartości.
- Typy: `SessionExpiryReason`.
- Propsy: `{ reason: SessionExpiryReason }`.

### SignInForm
- Opis komponentu: Formularz React Hook Form z walidacją Zod, obsługuje poświadczenia i wywołuje Supabase Auth.
- Główne elementy: `Form` RHF, `FormField` dla email i hasła, `Button` z loaderem, checkbox „Pokaż hasło” (opcjonalnie), `SR`-teksty dla dostępności.
- Obsługiwane interakcje: wprowadzanie danych, submit (`onSubmit`), klawisz Enter, toggle widoczności hasła.
- Obsługiwana walidacja: 
  - `email`: wymagany, wzorzec email, max 150 znaków.
  - `password`: wymagany, min 6 znaków, max 128 znaków.
  - Blokowanie wielokrotnych submitów podczas `status === 'submitting'`.
- Typy: `SignInFormValues`, `SignInStatus`, `SupabaseAuthError`.
- Propsy: `{ returnTo?: string; onSuccess(result: SignInSuccessPayload): void; onError(error: AuthErrorState): void }`.

### AuthErrorAlert
- Opis komponentu: Wyświetla błędy zwrócone z Supabase lub walidacji globalnej.
- Główne elementy: `Alert` z ikoną ostrzeżenia, listą komunikatów, `aria-live="assertive"`.
- Obsługiwane interakcje: opcjonalny przycisk ponów (wywołuje przekazaną funkcję `onRetry`).
- Obsługiwana walidacja: oczekuje struktury `AuthErrorState`.
- Typy: `AuthErrorState`.
- Propsy: `{ error: AuthErrorState | null; onRetry?: () => void }`.

### SignInFooterLinks
- Opis komponentu: Zbiór linków pomocniczych (reset hasła, kontakt).
- Główne elementy: link do Supabase reset (`/auth/reset`), mailto do wsparcia, informacja o wygaśnięciu sesji po 24h.
- Obsługiwane interakcje: kliknięcia w linki (nawigacja).
- Obsługiwana walidacja: brak.
- Typy: brak dodatkowych typów.
- Propsy: `{ supportEmail: string }`.

## 5. Typy
- `SignInPageProps`: { returnTo?: string; expired?: boolean } – używane w warstwie Astro do przekazania parametrów do wyspy.
- `SignInFormValues`: { email: string; password: string } – model formularza RHF, zgodny z walidacją Zod.
- `SignInStatus`: `'idle' | 'submitting' | 'success' | 'error'` – stan UI dla przycisku i blokad.
- `SessionExpiryReason`: `'timeout' | 'signed-out' | null` – kontroluje treść `SessionExpiryNotice`.
- `AuthErrorState`: { code: `AuthErrorCode`; message: string; details?: Record<string, unknown> } z `AuthErrorCode` = `'invalid_credentials' | 'email_not_confirmed' | 'rate_limited' | 'network' | 'unknown'`.
- `SignInSuccessPayload`: { user: UserDTO; company: CompanyDTO; redirectTo: string } – dane przekazywane po sukcesie.
- `RedirectMetadata`: { returnTo?: string } – wynik parsowania query paramów.

## 6. Zarządzanie stanem
- Formularz korzysta z `react-hook-form` z `zodResolver` dla synchronizacji walidacji.
- Wywołanie logowania opakowane w `useMutation` z `@tanstack/react-query` (klucz `auth/signin`) by mieć kontrolę nad `status`, retry i side-effectami (prefetch danych).
- Lokalne `useState` dla `authError`, `isPasswordVisible`, `SessionExpiryNotice` (dismiss).
- Custom hook `useSignIn`:
  - Odpowiada za konfigurację RHF, walidację, transformację błędów Supabase na `AuthErrorState`, wykonywanie `supabase.auth.signInWithPassword`.
  - Po sukcesie zapisuje sesję w Supabase (persisted przez SDK), wykonuje `queryClient.prefetchQuery` dla `/api/users/me` i `/api/companies/me`, po czym wywołuje `onSuccess`.
- Hook `useAuthRedirect` (w `SignInPage`) sprawdza `supabase.auth.getSession()` na mount i przekierowuje autoryzowanych użytkowników.

## 7. Integracja API
- `supabase.auth.signInWithPassword({ email, password })` – główne wywołanie; sukces zwraca `session` i `user`, błędy mapowane na `AuthErrorState`.
- Po zalogowaniu równolegle wykonujemy:
  - `fetch('/api/users/me')` z `UserDTO`.
  - `fetch('/api/companies/me')` z `CompanyDTO`.
  - Wyniki zapisujemy w cache TanStack Query (klucze `['users','me']`, `['companies','me']`) dla szybszego renderu `Dashboard`.
- Redirect następuje do `returnTo` (ograniczone do wewnętrznych ścieżek) lub `/dashboard`.
- W przypadku błędu `email_not_confirmed` prezentujemy link do ponownego wysłania maila (z Supabase `auth.resend()` jeśli zdecydujemy się dodać).

## 8. Interakcje użytkownika
- Wprowadzanie danych w polach `Email` i `Hasło` z walidacją inline (po blur i przy submit).
- Kliknięcie przycisku `Zaloguj` uruchamia proces logowania; w trakcie przycisk jest disabled i pokazuje spinner.
- Obsługa klawisza Enter w polach formularza.
- Kliknięcie linku `Nie pamiętasz hasła?` otwiera stronę resetu Supabase.
- Kliknięcie linku kontaktowego otwiera klienta poczty.
- Zamknięcie banera `SessionExpiryNotice` (jeśli włączone) usuwa go ze stanu lokalnego.

## 9. Warunki i walidacja
- `email` musi być poprawnym adresem (regex RFC z Zod) i niepusty; komunikat `Podaj adres e-mail`.
- `password` musi mieć 6–128 znaków; komunikat `Hasło musi mieć min. 6 znaków`.
- Submit niedostępny, gdy formularz ma błędy lub trwa logowanie.
- `returnTo` akceptuje wyłącznie ścieżki zaczynające się od `/` i nie zawierające protokołu; w innym przypadku ignorujemy i używamy `/dashboard`.
- Po błędzie `rate_limited` ustawiamy cooldown (np. `setTimeout` 30 s) i blokujemy przycisk.
- Jeżeli Supabase zwróci brak `session`, traktujemy to jako błąd krytyczny (`unknown`).

## 10. Obsługa błędów
- `invalid_credentials`: czerwony alert z instrukcją sprawdzenia danych, focus na pole hasła.
- `email_not_confirmed`: żółty alert z CTA do wysłania ponownego maila (jeżeli wdrożymy `supabase.auth.resend()`), inaczej komunikat kontaktu z administratorem.
- `rate_limited`: baner informuje o blokadzie i wskazuje czas oczekiwania.
- Błędy sieci (`TypeError`): alert z sugestią sprawdzenia połączenia, link do status page (jeśli istnieje).
- Nieznane błędy: logujemy w konsoli (lub wysyłamy do telemetry) i pokazujemy ogólny komunikat.
- W przypadku błędów podczas prefetchu `/api/users/me` lub `/api/companies/me` logujemy i pozwalamy na redirect; docelowy layout wykona retry.

## 11. Kroki implementacji
1. Utwórz stronę `src/pages/signin.astro` z layoutem publicznym, analizą query paramów i osadzeniem wyspy `SignInFormCard`.
2. Przygotuj moduł `src/components/auth/SignInFormCard.tsx` (React) wraz z `SessionExpiryNotice`, `AuthErrorAlert`, `SignInFooterLinks`.
3. Zaimplementuj `SignInForm.tsx` z React Hook Form + Zod, spinnerem i mapowaniem błędów Supabase.
4. Dodaj hook `useSignIn` w `src/lib/auth/useSignIn.ts` obsługujący `useMutation`, Supabase Auth i prefetch danych.
5. Dodaj hook `useAuthRedirect` w `src/lib/auth/useAuthRedirect.ts` dla przekierowania zalogowanych użytkowników; użyj w `SignInFormCard`.
6. Uzupełnij style Tailwind/Shadcn (Card, Alert, Button) oraz komunikaty `aria-live`.
7. Dodaj testy jednostkowe hooka (`useSignIn`) w Vitest (mock supabase), testy komponentu formularza (render + walidacja).
8. Zweryfikuj integrację: ręczne testy logowania, błędy 401/429, redirect `returnTo`.
9. Włącz telemetry (jeśli wymagane) i upewnij się, że middleware poprawnie zezwala na `/signin`.
10. Zaktualizuj dokumentację routingu (README/AI plan) i zgłoś do review.

