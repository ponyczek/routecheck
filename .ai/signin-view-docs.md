# Dokumentacja widoku Sign In

## Przegląd
Widok logowania zapewnia bezpieczne uwierzytelnienie użytkowników (spedytorów) przez Supabase Auth z pełną walidacją, obsługą błędów i dostępnością.

## Routing
- **Ścieżka**: `/signin`
- **Typ**: Strona publiczna (brak wymaganej autoryzacji)
- **Query params**:
  - `returnTo` - URL przekierowania po zalogowaniu (domyślnie `/dashboard`)
  - `expired` - czy sesja wygasła (`true`/`false`/`1`/`0`)
  - `reason` - powód wygaśnięcia (`timeout`/`signed-out`)

## Struktura komponentów

```
SignInPage (signin.astro)
└── SignInFormCard (React)
    ├── QueryProvider (React Query)
    ├── SessionExpiryNotice
    ├── AuthErrorAlert
    ├── SignInForm
    │   ├── EmailField
    │   ├── PasswordField (z toggle widoczności)
    │   └── SubmitButton
    └── SignInFooterLinks
```

## Główne komponenty

### SignInPage (`src/pages/signin.astro`)
- Renderuje layout publiczny
- Parsuje i waliduje query params
- Przekazuje credentials Supabase jako propsy do React
- Ustawia metadane SEO

### SignInFormCard (`src/components/auth/SignInFormCard.tsx`)
- Główny kontener z `Card` z shadcn/ui
- Zarządza globalnym stanem błędów
- Opakowuje w `QueryProvider`
- Obsługuje callbacks `onSuccess` i `onError`

### SignInForm (`src/components/auth/SignInForm.tsx`)
- Formularz React Hook Form + Zod
- Walidacja inline (po blur) i przy submit
- Toggle widoczności hasła
- Integracja z hookami `useSignIn` i `useAuthRedirect`
- Pełna dostępność (ARIA, screen readers)

### SessionExpiryNotice (`src/components/auth/SessionExpiryNotice.tsx`)
- Baner informujący o wygaśnięciu sesji
- Warianty: `timeout`, `signed-out`

### AuthErrorAlert (`src/components/auth/AuthErrorAlert.tsx`)
- Wyświetla błędy uwierzytelnienia
- Opcjonalny przycisk "Spróbuj ponownie"
- Atrybuty `aria-live="assertive"`

### SignInFooterLinks (`src/components/auth/SignInFooterLinks.tsx`)
- Link do resetu hasła (`/auth/reset`)
- Link do kontaktu (mailto)
- Informacja o wygaśnięciu sesji (24h)

## Custom Hooks

### useSignIn (`src/lib/auth/useSignIn.ts`)
```typescript
const { signIn, isLoading, isSuccess, isError, error, reset } = useSignIn({
  supabase,
  returnTo: '/dashboard',
  onSuccess: (redirectTo) => { /* ... */ },
  onError: (error) => { /* ... */ },
});
```

**Funkcje:**
- Wywołuje `supabase.auth.signInWithPassword()`
- Mapuje błędy Supabase na przyjazne komunikaty
- Zarządza stanem przez React Query (`useMutation`)
- Obsługuje rate limiting, błędy sieci, niepotwierdzone email
- Automatyczne zapisywanie sesji w localStorage

### useAuthRedirect (`src/lib/auth/useAuthRedirect.ts`)
```typescript
useAuthRedirect(supabase, returnTo, enabled);
```

**Funkcje:**
- Sprawdza aktywną sesję przy montowaniu
- Przekierowuje zalogowanych użytkowników
- Opcja włączania/wyłączania (`enabled`)

## Typy

### SignInFormValues
```typescript
interface SignInFormValues {
  email: string;
  password: string;
}
```

### AuthErrorState
```typescript
interface AuthErrorState {
  code: 'invalid_credentials' | 'email_not_confirmed' | 'rate_limited' | 'network' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
}
```

### SessionExpiryReason
```typescript
type SessionExpiryReason = 'timeout' | 'signed-out' | null;
```

## Walidacja

### Email
- Wymagany
- Format email (RFC)
- Max 150 znaków
- Komunikat: "Podaj adres e-mail" / "Podaj poprawny adres e-mail"

### Password
- Wymagany
- Min 6 znaków
- Max 128 znaków
- Komunikat: "Hasło musi mieć min. 6 znaków"

### returnTo
- Tylko wewnętrzne ścieżki (zaczynające się od `/`)
- Blokada protokołów (`://`)
- Fallback: `/dashboard`

## Obsługa błędów

### invalid_credentials
- **Kod**: 400
- **Komunikat**: "Nieprawidłowy email lub hasło. Sprawdź swoje dane i spróbuj ponownie."
- **Akcja**: Focus na pole hasła

### email_not_confirmed
- **Kod**: 400
- **Komunikat**: "Twój email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową."
- **Akcja**: Informacja dla użytkownika

### rate_limited
- **Kod**: 429
- **Komunikat**: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę."
- **Akcja**: Blokada przycisku

### network
- **Komunikat**: "Błąd połączenia. Sprawdź swoje połączenie internetowe i spróbuj ponownie."
- **Akcja**: Informacja dla użytkownika

### unknown
- **Komunikat**: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
- **Akcja**: Logowanie w konsoli

## Bezpieczeństwo

1. **Zmienne środowiskowe**:
   - Przekazywane przez SSR (nie eksponowane w bundle klienta)
   - `SUPABASE_URL` i `SUPABASE_KEY`

2. **Walidacja returnTo**:
   - Tylko wewnętrzne ścieżki
   - Blokada open redirect

3. **Sesja**:
   - Zapisywana w localStorage
   - Auto-refresh tokenów
   - Wygasa po 24h nieaktywności

## Dostępność (a11y)

- ✅ ARIA labels na wszystkich polach
- ✅ `aria-invalid` dla pól z błędami
- ✅ `aria-describedby` dla komunikatów błędów
- ✅ `aria-live` regions dla dynamicznych komunikatów
- ✅ `role="alert"` dla błędów
- ✅ Focus management
- ✅ Nawigacja klawiaturą
- ✅ Screen reader support

## Testy

### Pokrycie testowe
- ✅ **98 testów przechodzi** (100% success rate)
- ✅ Walidacja (26 testów)
- ✅ Hook useSignIn (6 testów)
- ✅ Komponenty React (14 testów)
- ✅ Integracja istniejących serwisów

### Uruchomienie testów
```bash
npm test                  # Uruchom wszystkie testy
npm test -- --watch       # Tryb watch
npm test -- --coverage    # Z pokryciem kodu
```

## Użycie

### Podstawowe logowanie
```
http://localhost:3000/signin
```

### Z przekierowaniem
```
http://localhost:3000/signin?returnTo=/reports
```

### Po wygaśnięciu sesji
```
http://localhost:3000/signin?expired=true&reason=timeout
```

## Pliki

### Komponenty
- `src/pages/signin.astro` - Strona logowania
- `src/components/auth/SignInFormCard.tsx` - Kontener formularza
- `src/components/auth/SignInForm.tsx` - Formularz
- `src/components/auth/SessionExpiryNotice.tsx` - Baner wygaśnięcia
- `src/components/auth/AuthErrorAlert.tsx` - Alert błędów
- `src/components/auth/SignInFooterLinks.tsx` - Linki pomocnicze

### Hooks i utils
- `src/lib/auth/useSignIn.ts` - Hook logowania
- `src/lib/auth/useAuthRedirect.ts` - Hook przekierowania
- `src/lib/auth/types.ts` - Typy TypeScript
- `src/lib/auth/validation.ts` - Walidacja Zod

### Testy
- `src/lib/auth/__tests__/validation.test.ts`
- `src/lib/auth/__tests__/useSignIn.test.tsx`
- `src/components/auth/__tests__/*.test.tsx`

### Konfiguracja
- `vitest.config.ts` - Konfiguracja testów
- `src/lib/test/setup.ts` - Setup testów
- `src/lib/query-client.tsx` - React Query provider

## Zależności

### Główne
- `react-hook-form` - zarządzanie formularzem
- `@tanstack/react-query` - zarządzanie stanem
- `@hookform/resolvers` - integracja Zod z RHF
- `zod` - walidacja
- `@supabase/supabase-js` - uwierzytelnienie

### UI
- `@radix-ui/react-*` - prymitywy dostępności
- `lucide-react` - ikony
- `tailwindcss` - stylowanie

### Testy
- `vitest` - test runner
- `@testing-library/react` - testowanie React
- `@testing-library/user-event` - symulacja interakcji
- `@testing-library/jest-dom` - matchers

## Możliwe rozszerzenia

1. **OAuth providers** (Google, GitHub)
2. **Two-Factor Authentication (2FA)**
3. **Remember me** checkbox
4. **Rate limiting UI** (countdown timer)
5. **Resend confirmation email** flow
6. **Telemetry** (tracking błędów logowania)
7. **Prefetch user data** po zalogowaniu


