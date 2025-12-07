# Plan implementacji widoku rejestracji (Sign-Up)

## 1. Przegląd

Widok rejestracji pozwala nowym użytkownikom utworzyć konto firmowe w aplikacji RouteCheck. Użytkownik podaje nazwę firmy, email oraz hasło (z potwierdzeniem), a system tworzy zarówno konto firmy w bazie danych, jak i użytkownika w Supabase Auth. Po pomyślnej rejestracji następuje automatyczne przekierowanie do panelu (dashboard) lub do strony potwierdzenia email, w zależności od konfiguracji Supabase Auth.

Widok jest zoptymalizowany pod kątem UX i dostępności, oferuje walidację inline, wskaźnik siły hasła, obsługę błędów (duplikaty email, słabe hasła) oraz zapobiega wielokrotnym rejestracjom. Wykorzystuje Supabase Auth do zarządzania autentykacją oraz dedykowany endpoint `/api/companies/me` do weryfikacji utworzenia firmy.

## 2. Routing widoku

**Ścieżka:** `/signup`

**Dostępność:** Publiczny widok (bez wymagania uwierzytelnienia). Jeśli użytkownik jest już zalogowany, powinien być automatycznie przekierowany do dashboard.

**Query params (opcjonalne):**

- `returnTo` – URL do przekierowania po pomyślnej rejestracji (np. `/dashboard`)

## 3. Struktura komponentów

Hierarchia komponentów:

```
signup.astro (Astro Page)
└─ SignUpFormCard (React)
   ├─ SessionExpiryNotice (React) – opcjonalny komunikat o wygasłej sesji
   ├─ AuthErrorAlert (React) – alert błędu rejestracji
   ├─ SignUpForm (React) – główny formularz rejestracji
   │  ├─ Label (Shadcn UI)
   │  ├─ Input (Shadcn UI)
   │  ├─ PasswordStrengthIndicator (React) – wskaźnik siły hasła
   │  └─ Button (Shadcn UI)
   └─ SignUpFooterLinks (React) – linki pomocnicze (powrót do logowania)
```

## 4. Szczegóły komponentów

### SignUpFormCard

**Opis:** Główny kontener widoku rejestracji. Odpowiada za zarządzanie stanem błędów, komunikatów i koordynację między podkomponentami. Zawiera logikę obsługi sukcesu i błędów rejestracji.

**Główne elementy:**

- `<Card>` z Shadcn UI jako kontener wizualny
- `<CardHeader>` z tytułem "Załóż konto firmowe" i opisem
- Warunkowy `<SessionExpiryNotice>` jeśli przekazano `sessionExpiryReason`
- Warunkowy `<AuthErrorAlert>` jeśli wystąpił błąd rejestracji
- `<SignUpForm>` – główny formularz
- `<SignUpFooterLinks>` – linki nawigacyjne

**Obsługiwane zdarzenia:**

- `onSuccess` – callback po pomyślnej rejestracji, wykonuje redirect przez `window.location.href`
- `onError` – callback przy błędzie, aktualizuje stan `errorState`

**Warunki walidacji:**

- N/A – ten komponent deleguje walidację do `SignUpForm`

**Typy:**

- Props: `SignUpFormCardProps`
- State: `errorState: AuthErrorState | null`

**Propsy:**

```typescript
interface SignUpFormCardProps {
  returnTo?: string;
  sessionExpiryReason?: SessionExpiryReason;
  supabaseUrl: string;
  supabaseKey: string;
}
```

---

### SignUpForm

**Opis:** Formularz rejestracji z czterema polami (nazwa firmy, email, hasło, potwierdzenie hasła). Wykorzystuje React Hook Form z walidacją Zod. Pokazuje błędy inline dla każdego pola oraz wskaźnik siły hasła dla pola hasło. Obsługuje toggle widoczności hasła.

**Główne elementy:**

- `<form>` z `handleSubmit` z React Hook Form
- Pole nazwa firmy: `<Label>` + `<Input>`
- Pole email: `<Label>` + `<Input type="email">`
- Pole hasło: `<Label>` + `<Input type="password">` + przycisk toggle (ikona `Eye`/`EyeOff`) + `<PasswordStrengthIndicator>`
- Pole potwierdzenie hasła: `<Label>` + `<Input type="password">` + przycisk toggle
- Przycisk submit: `<Button>` z ikoną `Loader2` i tekstem "Załóż konto" / "Tworzenie konta..."
- `<div className="sr-only">` z `role="status"` dla ogłoszeń screen readera

**Obsługiwane zdarzenia:**

- `onSubmit` – wywołuje `signUp` z hooka `useSignUp`
- `onClick` na przyciskach toggle – zmienia stan `showPassword` / `showConfirmPassword`
- `onChange` / `onBlur` na polach – walidacja React Hook Form

**Warunki walidacji:**
Walidacja według schematu `signUpFormSchema`:

1. **companyName:**
   - Wymagane (min. 1 znak)
   - Min. 2 znaki
   - Max. 100 znaków
   - Automatyczne `trim()`
2. **email:**
   - Wymagane (min. 1 znak)
   - Poprawny format email
   - Max. 150 znaków
   - Automatyczne `toLowerCase()` i `trim()`
3. **password:**
   - Wymagane (min. 1 znak)
   - Min. 8 znaków
   - Max. 128 znaków
   - Regex: co najmniej jedna mała litera, jedna wielka litera i jedna cyfra
4. **confirmPassword:**
   - Wymagane (min. 1 znak)
   - Musi być identyczne z polem `password` (refine w Zod)

**Typy:**

- Props: `SignUpFormProps`
- Form values: `SignUpFormValues`

**Propsy:**

```typescript
interface SignUpFormProps {
  returnTo?: string;
  onSuccess: (result: SignUpSuccessPayload) => void;
  onError: (error: AuthErrorState) => void;
  supabaseUrl: string;
  supabaseKey: string;
}
```

---

### PasswordStrengthIndicator

**Opis:** Komponent wizualizujący siłę hasła w czasie rzeczywistym. Pokazuje pasek postępu i etykietę tekstową ("Słabe", "Średnie", "Silne"). Wykorzystuje hook `usePasswordStrength` do obliczania siły hasła na podstawie jego długości i złożoności.

**Główne elementy:**

- `<div>` kontener z etykietą i paskiem
- Etykieta tekstowa z dynamicznym kolorem (red/yellow/green)
- Pasek postępu (3 segmenty, wypełniane na podstawie siły)

**Obsługiwane zdarzenia:**

- N/A – komponent tylko wizualizuje dane

**Warunki walidacji:**

- N/A – nie wykonuje walidacji, tylko prezentuje wynik z `usePasswordStrength`

**Typy:**

- Props: `PasswordStrengthIndicatorProps`
- Strength: `PasswordStrength` ("weak" | "medium" | "strong")

**Propsy:**

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}
```

---

### AuthErrorAlert

**Opis:** Komponent wyświetlający alertu błędu autentykacji/rejestracji. Pokazuje komunikat błędu w czytelnej formie z odpowiednią ikoną i kolorystyką. Wykorzystuje komponent `<Alert>` z Shadcn UI.

**Główne elementy:**

- `<Alert variant="destructive">` z ikona `AlertCircle`
- `<AlertTitle>` – tytuł błędu
- `<AlertDescription>` – opis błędu

**Obsługiwane zdarzenia:**

- N/A – komponent tylko prezentacyjny

**Warunki walidacji:**

- N/A

**Typy:**

- Props: `AuthErrorAlertProps`
- Error: `AuthErrorState`

**Propsy:**

```typescript
interface AuthErrorAlertProps {
  error: AuthErrorState;
}
```

---

### SignUpFooterLinks

**Opis:** Komponent z linkami nawigacyjnymi pod formularzem. Zawiera link powrotny do strony logowania ("Masz już konto? Zaloguj się").

**Główne elementy:**

- `<div>` kontener z tekstem i linkiem
- `<a href="/signin">` link do strony logowania

**Obsługiwane zdarzenia:**

- N/A – standardowa nawigacja HTML

**Warunki walidacji:**

- N/A

**Typy:**

- Props: brak (komponent nie przyjmuje propsów)

**Propsy:**

```typescript
// Brak propsów
```

---

### SessionExpiryNotice

**Opis:** Komponent informacyjny pokazujący komunikat o wygaśnięciu sesji (jeśli użytkownik został przekierowany z powodu timeout lub wylogowania). Wykorzystuje `<Alert>` z Shadcn UI w wariancie "info".

**Główne elementy:**

- `<Alert variant="default">` z ikoną `Info`
- `<AlertTitle>` – tytuł informacyjny
- `<AlertDescription>` – opis przyczyny wygaśnięcia

**Obsługiwane zdarzenia:**

- N/A

**Warunki walidacji:**

- N/A

**Typy:**

- Props: `SessionExpiryNoticeProps`

**Propsy:**

```typescript
interface SessionExpiryNoticeProps {
  reason: SessionExpiryReason;
}
```

---

## 5. Typy

### Nowe typy i interfejsy

#### SignUpFormValues

Wartości formularza rejestracji (pochodzące z React Hook Form):

```typescript
export interface SignUpFormValues {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
```

#### SignUpSuccessPayload

Dane zwracane po pomyślnej rejestracji:

```typescript
export interface SignUpSuccessPayload {
  redirectTo: string;
  userId: string; // UUID użytkownika z Supabase Auth
  companyId: string; // UUID firmy z tabeli companies
}
```

#### SignUpFormProps

Propsy komponentu SignUpForm:

```typescript
interface SignUpFormProps {
  returnTo?: string;
  onSuccess: (result: SignUpSuccessPayload) => void;
  onError: (error: AuthErrorState) => void;
  supabaseUrl: string;
  supabaseKey: string;
}
```

#### SignUpFormCardProps

Propsy komponentu SignUpFormCard:

```typescript
interface SignUpFormCardProps {
  returnTo?: string;
  sessionExpiryReason?: SessionExpiryReason;
  supabaseUrl: string;
  supabaseKey: string;
}
```

#### PasswordStrengthIndicatorProps

Propsy komponentu wskaźnika siły hasła:

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}
```

### Istniejące typy wykorzystywane w implementacji

Z `src/lib/auth/types.ts`:

- `AuthErrorState` – stan błędu autentykacji
- `AuthErrorCode` – kod błędu (rozszerzyć o "company_creation_failed")
- `SessionExpiryReason` – powód wygaśnięcia sesji

Z `src/types.ts`:

- `CompanyDTO` – obiekt firmy zwracany przez `/api/companies/me`
- `UserDTO` – obiekt użytkownika

## 6. Zarządzanie stanem

### Hook useSignUp

Dedykowany custom hook zarządzający procesem rejestracji. Wykorzystuje TanStack Query (`useMutation`) dla zarządzania asynchronicznym stanem.

**Lokalizacja:** `src/lib/auth/useSignUp.ts`

**Interfejs:**

```typescript
interface UseSignUpOptions {
  supabase: SupabaseClient;
  returnTo?: string;
  onSuccess?: (result: SignUpSuccessPayload) => void;
  onError?: (error: AuthErrorState) => void;
}

function useSignUp(options: UseSignUpOptions): {
  signUp: (credentials: SignUpFormValues) => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: AuthErrorState | null;
  reset: () => void;
};
```

**Logika:**

1. Wywołanie `supabase.auth.signUp()` z email i password
2. Mapowanie błędów Supabase na `AuthErrorState`:
   - "User already registered" → `email_already_exists`
   - "Password should be at least 6 characters" → `weak_password`
   - Status 429 → `rate_limited`
   - Network error → `network`
   - Pozostałe → `unknown`
3. Po pomyślnej rejestracji w Supabase Auth:
   - Pobranie user ID z `authData.user.id`
   - Wywołanie `/api/auth/set-session` do synchronizacji sesji z cookies
   - Utworzenie firmy przez API: `POST /api/companies/me` z `{ name: companyName }`
   - Weryfikacja utworzenia firmy: `GET /api/companies/me`
4. Wywołanie `onSuccess` z `SignUpSuccessPayload` lub `onError` przy błędzie

**Stan:**

- `isPending` – rejestracja w toku
- `isSuccess` – rejestracja zakończona pomyślnie
- `isError` – wystąpił błąd
- `error` – obiekt błędu `AuthErrorState`

---

### Hook usePasswordStrength

Hook obliczający siłę hasła na podstawie jego zawartości.

**Lokalizacja:** `src/lib/auth/usePasswordStrength.ts`

**Interfejs:**

```typescript
function usePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0-3
};
```

**Logika:**

- Długość < 8 znaków → `weak`
- Długość >= 8 i spełnia podstawowe wymagania (litera, cyfra) → `medium`
- Długość >= 12, wielkie i małe litery, cyfry, znaki specjalne → `strong`

---

### Hook useAuthRedirect

Hook sprawdzający czy użytkownik jest już zalogowany i przekierowujący do dashboard jeśli tak.

**Lokalizacja:** `src/lib/auth/useAuthRedirect.ts`

**Interfejs:**

```typescript
function useAuthRedirect(supabase: SupabaseClient, returnTo?: string): void;
```

**Logika:**

- `useEffect` sprawdza sesję przez `supabase.auth.getSession()`
- Jeśli sesja istnieje → `window.location.href = returnTo || '/dashboard'`

---

### Stan lokalny komponentów

**SignUpFormCard:**

- `errorState: AuthErrorState | null` – przechowuje błąd rejestracji

**SignUpForm:**

- `showPassword: boolean` – toggle widoczności pola hasła
- `showConfirmPassword: boolean` – toggle widoczności pola potwierdzenia hasła
- Form state zarządzany przez React Hook Form

## 7. Integracja API

### Supabase Auth API

**Endpoint:** Supabase Auth SDK – `signUp()`

**Typ żądania:**

```typescript
{
  email: string;
  password: string;
  options?: {
    data?: {
      companyName: string; // metadata użytkownika
    };
  };
}
```

**Typ odpowiedzi (sukces):**

```typescript
{
  user: {
    id: string;
    email: string;
    // ... inne pola
  } | null;
  session: Session | null;
}
```

**Typ odpowiedzi (błąd):**

```typescript
{
  error: {
    message: string;
    status?: number;
  };
}
```

---

### POST /api/auth/set-session

Synchronizacja sesji Supabase z cookies serwera (dla middleware).

**Typ żądania:**

```typescript
{
  access_token: string;
  refresh_token: string;
}
```

**Typ odpowiedzi (sukces):**

```typescript
{
  success: true;
}
```

**Typ odpowiedzi (błąd):**

```typescript
{
  code: string;
  message: string;
}
```

---

### POST /api/companies (do utworzenia)

Utworzenie firmy dla nowo zarejestrowanego użytkownika.

**Endpoint:** `POST /api/companies`

**Typ żądania:**

```typescript
{
  name: string;
}
```

**Typ odpowiedzi (sukces):**

```typescript
CompanyDTO; // z types.ts
{
  uuid: string;
  name: string;
  createdAt: string;
}
```

**Typ odpowiedzi (błąd):**

```typescript
ProblemDetail // z types.ts
{
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

**Kody błędów:**

- 401 – Unauthorized (brak sesji)
- 409 – Conflict (firma już istnieje dla tego użytkownika)
- 500 – Internal Server Error

---

### GET /api/companies/me

Weryfikacja utworzenia firmy i pobranie jej danych.

**Endpoint:** `GET /api/companies/me`

**Typ żądania:** brak body (GET)

**Typ odpowiedzi (sukces):**

```typescript
CompanyDTO;
{
  uuid: string;
  name: string;
  createdAt: string;
}
```

**Typ odpowiedzi (błąd):**

```typescript
ProblemDetail
{
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

**Kody błędów:**

- 401 – Unauthorized
- 404 – Not Found (firma nie istnieje)
- 500 – Internal Server Error

---

## 8. Interakcje użytkownika

### Ładowanie strony

1. Strona `/signup` renderuje `SignUpFormCard`
2. Hook `useAuthRedirect` sprawdza czy użytkownik jest zalogowany
3. Jeśli zalogowany → automatyczne przekierowanie do `/dashboard`
4. Jeśli niezalogowany → wyświetlenie formularza

### Wypełnianie formularza

1. Użytkownik wpisuje nazwę firmy
2. Użytkownik wpisuje email
3. Użytkownik wpisuje hasło
   - Wskaźnik siły hasła aktualizuje się w czasie rzeczywistym
   - Użytkownik może kliknąć ikonę oka aby pokazać/ukryć hasło
4. Użytkownik wpisuje potwierdzenie hasła
   - Użytkownik może kliknąć ikonę oka aby pokazać/ukryć hasło
5. Walidacja inline uruchamia się `onBlur` dla każdego pola
6. Błędy walidacji pokazują się pod polami w czerwonym kolorze

### Submit formularza

1. Użytkownik klika przycisk "Załóż konto"
2. Przycisk zmienia się na "Tworzenie konta..." z spinnerem
3. Wszystkie pola stają się disabled
4. Hook `useSignUp` wykonuje proces rejestracji
5. W przypadku sukcesu:
   - Wywołanie `onSuccess` callback
   - Przekierowanie do `returnTo` lub `/dashboard`
   - Użytkownik widzi dashboard
6. W przypadku błędu:
   - Wywołanie `onError` callback
   - Aktualizacja stanu `errorState`
   - Wyświetlenie `<AuthErrorAlert>` nad formularzem
   - Przycisk wraca do stanu "Załóż konto"
   - Pola stają się ponownie edytowalne

### Obsługa błędów specyficznych

1. **Email already exists (409):**
   - Alert: "Ten adres email jest już zarejestrowany. Zaloguj się lub użyj innego adresu."
   - Link do `/signin` w alercie
2. **Weak password:**
   - Alert: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków, w tym wielkich i małych liter oraz cyfr."
3. **Rate limited (429):**
   - Alert: "Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę."
4. **Network error:**
   - Alert: "Błąd połączenia. Sprawdź swoje połączenie internetowe i spróbuj ponownie."

### Nawigacja do logowania

1. Użytkownik klika link "Masz już konto? Zaloguj się" w `SignUpFooterLinks`
2. Przekierowanie do `/signin`

### Dostępność (keyboard navigation)

1. Użytkownik może nawigować Tabem między polami
2. Enter w dowolnym polu submittuje formularz
3. Screen reader ogłasza błędy walidacji przez `aria-describedby`
4. Stan ładowania ogłaszany przez `aria-live="polite"`
5. Przyciski toggle hasła dostępne z klawiatury

## 9. Warunki i walidacja

### Walidacja kliencka (React Hook Form + Zod)

Wszystkie warunki walidowane w komponencie `SignUpForm` przez schemat `signUpFormSchema`:

1. **Nazwa firmy (`companyName`):**
   - Wymagane: "Podaj nazwę firmy"
   - Min. długość 2: "Nazwa firmy musi mieć co najmniej 2 znaki"
   - Max. długość 100: "Nazwa firmy jest za długa (max. 100 znaków)"
   - Automatyczny trim białych znaków

2. **Email (`email`):**
   - Wymagane: "Podaj adres e-mail"
   - Format email: "Podaj poprawny adres e-mail"
   - Max. długość 150: "Adres e-mail jest za długi"
   - Automatyczny lowercase i trim

3. **Hasło (`password`):**
   - Wymagane: "Podaj hasło"
   - Min. długość 8: "Hasło musi mieć min. 8 znaków"
   - Max. długość 128: "Hasło jest za długie (max. 128 znaków)"
   - Regex: "Hasło powinno zawierać małe i wielkie litery oraz cyfry"
   - Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`

4. **Potwierdzenie hasła (`confirmPassword`):**
   - Wymagane: "Potwierdź hasło"
   - Zgodność z polem `password`: "Hasła muszą być takie same"

**Sposób walidacji:**

- Mode: `onBlur` – walidacja uruchamia się po opuszczeniu pola
- Błędy pokazują się pod odpowiednim polem z `role="alert"`
- Stan błędu przekazywany do pola przez `aria-invalid`

### Walidacja serwerowa (Supabase Auth)

1. **Unikalność email:**
   - Warunek: Email nie może być już zarejestrowany w systemie
   - Błąd: "User already registered"
   - Kod: `email_already_exists`
   - Komunikat PL: "Ten adres email jest już zarejestrowany"

2. **Siła hasła:**
   - Warunek: Hasło min. 6 znaków (policy Supabase)
   - Błąd: "Password should be at least 6 characters"
   - Kod: `weak_password`
   - Komunikat PL: "Hasło jest zbyt słabe"

3. **Rate limiting:**
   - Warunek: Max liczba prób rejestracji w określonym czasie
   - Błąd: Status 429
   - Kod: `rate_limited`
   - Komunikat PL: "Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę."

### Walidacja biznesowa (API)

1. **Utworzenie firmy:**
   - Warunek: Użytkownik nie może mieć więcej niż jednej firmy
   - Endpoint: `POST /api/companies`
   - Błąd: 409 Conflict
   - Kod: `company_creation_failed`
   - Komunikat PL: "Nie udało się utworzyć firmy. Skontaktuj się z pomocą techniczną."

## 10. Obsługa błędów

### Błędy walidacji formularza

**Scenariusz:** Użytkownik próbuje submit formularza z nieprawidłowymi danymi

**Obsługa:**

- React Hook Form blokuje submit
- Błędy pokazują się pod odpowiednimi polami
- Pierwszy błędny input otrzymuje focus
- Screen reader odczytuje komunikaty błędów

**Kod:**

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<SignUpFormValues>({
  resolver: zodResolver(signUpFormSchema),
  mode: "onBlur",
});
```

---

### Błąd: Email już istnieje

**Scenariusz:** Użytkownik próbuje zarejestrować się z emailem, który już istnieje w systemie

**Kod błędu:** `email_already_exists`

**Obsługa:**

1. Supabase zwraca błąd "User already registered"
2. Hook `useSignUp` mapuje błąd na `AuthErrorState`:
   ```typescript
   {
     code: "email_already_exists",
     message: "Ten adres email jest już zarejestrowany. Zaloguj się lub użyj innego adresu."
   }
   ```
3. Wyświetlenie `<AuthErrorAlert>` nad formularzem
4. Alert zawiera link do `/signin`

**UX:** Pole email podświetlone, użytkownik może zmienić email lub przejść do logowania

---

### Błąd: Słabe hasło

**Scenariusz:** Hasło nie spełnia wymagań Supabase (min. 6 znaków) lub ma inny problem po stronie serwera

**Kod błędu:** `weak_password`

**Obsługa:**

1. Supabase zwraca błąd password-related
2. Mapowanie na `AuthErrorState`:
   ```typescript
   {
     code: "weak_password",
     message: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków, w tym wielkich i małych liter oraz cyfr."
   }
   ```
3. Wyświetlenie alertu
4. Wskaźnik siły hasła pomaga użytkownikowi stworzyć silniejsze hasło

**UX:** Podpowiedź jak poprawić hasło

---

### Błąd: Rate limiting

**Scenariusz:** Zbyt wiele prób rejestracji w krótkim czasie

**Kod błędu:** `rate_limited`

**Obsługa:**

1. Supabase zwraca status 429
2. Mapowanie na `AuthErrorState`:
   ```typescript
   {
     code: "rate_limited",
     message: "Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę."
   }
   ```
3. Wyświetlenie alertu
4. Przycisk submit pozostaje disabled na określony czas (opcjonalnie)

**UX:** Jasny komunikat z prośbą o poczekanie

---

### Błąd: Utworzenie firmy nie powiodło się

**Scenariusz:** Rejestracja w Supabase Auth zakończyła się sukcesem, ale utworzenie firmy w bazie danych nie powiodło się

**Kod błędu:** `company_creation_failed`

**Obsługa:**

1. `POST /api/companies` zwraca 409 lub 500
2. Mapowanie na `AuthErrorState`:
   ```typescript
   {
     code: "company_creation_failed",
     message: "Nie udało się utworzyć firmy. Skontaktuj się z pomocą techniczną.",
     details: { userId: "..." }
   }
   ```
3. Wyświetlenie alertu z instrukcją kontaktu
4. Logowanie błędu po stronie klienta (opcjonalnie telemetry)

**UX:** Użytkownik jest poinformowany, że konto zostało utworzone, ale proces nie został dokończony

**Recovery:** Użytkownik może spróbować zalogować się – system powinien wykryć brak firmy i przeprowadzić proces onboardingu

---

### Błąd sieciowy

**Scenariusz:** Brak połączenia z internetem lub problem sieciowy

**Kod błędu:** `network`

**Obsługa:**

1. Catch TypeError z fetch
2. Mapowanie na `AuthErrorState`:
   ```typescript
   {
     code: "network",
     message: "Błąd połączenia. Sprawdź swoje połączenie internetowe i spróbuj ponownie."
   }
   ```
3. Wyświetlenie alertu
4. Przycisk retry dostępny

**UX:** Jasny komunikat o problemie z siecią, instrukcja co zrobić

---

### Błąd nieoczekiwany

**Scenariusz:** Dowolny inny błąd, którego nie przewidzieliśmy

**Kod błędu:** `unknown`

**Obsługa:**

1. Catch-all w `useSignUp`
2. Mapowanie na `AuthErrorState`:
   ```typescript
   {
     code: "unknown",
     message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
     details: { error: "..." }
   }
   ```
3. Wyświetlenie alertu
4. Logowanie szczegółów błędu (console.error, telemetry)

**UX:** Ogólny komunikat z prośbą o ponowną próbę lub kontakt

---

### Strategia obsługi błędów – podsumowanie

1. **Walidacja kliencka** – natychmiastowa, inline, pod polami
2. **Błędy Supabase Auth** – mapowane na `AuthErrorState`, wyświetlane w `<AuthErrorAlert>`
3. **Błędy API** – mapowane na `AuthErrorState`, wyświetlane w `<AuthErrorAlert>`
4. **Błędy sieciowe** – dedykowany komunikat z instrukcją
5. **Błędy nieoczekiwane** – logowanie, ogólny komunikat dla użytkownika
6. **Accessibility** – wszystkie błędy dostępne dla screen readerów przez `role="alert"` i `aria-live`

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i schematów walidacji

**Lokalizacja:** `src/lib/auth/types.ts`, `src/lib/auth/validation.ts`

**Zadania:**

1. Upewnij się, że `SignUpFormValues` istnieje w `types.ts` (jeśli nie – dodaj)
2. Dodaj `SignUpSuccessPayload` do `types.ts`
3. Rozszerz `AuthErrorCode` o `company_creation_failed` (jeśli jeszcze nie ma)
4. Upewnij się, że `signUpFormSchema` istnieje w `validation.ts` (już istnieje zgodnie z przeczytanym kodem)

**Oczekiwany rezultat:** Wszystkie typy dostępne do importu

---

### Krok 2: Implementacja hooka usePasswordStrength

**Lokalizacja:** `src/lib/auth/usePasswordStrength.ts`

**Zadania:**

1. Utwórz hook `usePasswordStrength(password: string)`
2. Implementuj logikę obliczania siły hasła:
   - Sprawdź długość (< 8: weak, >= 8: medium, >= 12: strong)
   - Sprawdź obecność małych liter, wielkich liter, cyfr, znaków specjalnych
   - Zwróć `{ strength: PasswordStrength, score: number }`
3. Użyj `useMemo` do optymalizacji obliczeń

**Oczekiwany rezultat:** Hook działający i przetestowany

---

### Krok 3: Implementacja hooka useSignUp

**Lokalizacja:** `src/lib/auth/useSignUp.ts`

**Zadania:**

1. Utwórz hook z interfejsem `UseSignUpOptions`
2. Użyj `useMutation` z TanStack Query
3. Implementuj `mutationFn`:
   - Wywołaj `supabase.auth.signUp()` z email i password
   - Obsłuż błędy Supabase i zmapuj na `AuthErrorState`
   - Po sukcesie: wywołaj `/api/auth/set-session`
   - Wywołaj `POST /api/companies` z nazwą firmy
   - Zweryfikuj utworzenie przez `GET /api/companies/me`
   - Zwróć `SignUpSuccessPayload`
4. Implementuj `onSuccess` i `onError` callbacks
5. Zwróć obiekt z metodami `signUp`, `isLoading`, etc.

**Oczekiwany rezultat:** Hook działający, obsługujący cały flow rejestracji

---

### Krok 4: Implementacja komponentu PasswordStrengthIndicator

**Lokalizacja:** `src/components/auth/PasswordStrengthIndicator.tsx`

**Zadania:**

1. Utwórz komponent przyjmujący props `{ password, className? }`
2. Użyj `usePasswordStrength` do obliczenia siły
3. Zaimplementuj UI:
   - Etykieta tekstowa (Słabe/Średnie/Silne) z dynamicznym kolorem
   - Pasek postępu (3 segmenty)
   - Stylizacja Tailwind z wariantami kolorów (red-500, yellow-500, green-500)
4. Dodaj testy jednostkowe

**Oczekiwany rezultat:** Komponent wizualizujący siłę hasła

---

### Krok 5: Implementacja komponentu SignUpForm

**Lokalizacja:** `src/components/auth/SignUpForm.tsx`

**Zadania:**

1. Utwórz komponent z propsami `SignUpFormProps`
2. Użyj `useForm` z `zodResolver(signUpFormSchema)`
3. Utwórz klienta Supabase (jak w `SignInForm.tsx`)
4. Użyj hooka `useAuthRedirect` (przekierowanie jeśli już zalogowany)
5. Użyj hooka `useSignUp`
6. Zaimplementuj formularz z polami:
   - Nazwa firmy
   - Email
   - Hasło (z toggle widoczności i `<PasswordStrengthIndicator>`)
   - Potwierdzenie hasła (z toggle widoczności)
7. Zaimplementuj obsługę `handleSubmit`
8. Dodaj przycisk submit z loaderem
9. Dodaj ARIA attributes (invalid, describedby, live region)

**Oczekiwany rezultat:** Pełny działający formularz rejestracji

---

### Krok 6: Implementacja komponentu SignUpFormCard

**Lokalizacja:** `src/components/auth/SignUpFormCard.tsx`

**Zadania:**

1. Utwórz komponent z propsami `SignUpFormCardProps`
2. Zarządzaj stanem `errorState`
3. Zaimplementuj strukturę:
   - `<Card>` jako kontener
   - `<CardHeader>` z tytułem i opisem
   - Warunkowy `<SessionExpiryNotice>` (jeśli `sessionExpiryReason`)
   - Warunkowy `<AuthErrorAlert>` (jeśli `errorState`)
   - `<SignUpForm>` z callbackami
   - `<SignUpFooterLinks>`
4. Implementuj callback `onSuccess`:
   ```typescript
   const handleSuccess = (result: SignUpSuccessPayload) => {
     window.location.href = result.redirectTo;
   };
   ```
5. Implementuj callback `onError`:
   ```typescript
   const handleError = (error: AuthErrorState) => {
     setErrorState(error);
   };
   ```

**Oczekiwany rezultat:** Główny kontener widoku gotowy

---

### Krok 7: Implementacja komponentu SignUpFooterLinks

**Lokalizacja:** `src/components/auth/SignUpFooterLinks.tsx`

**Zadania:**

1. Utwórz prosty komponent z linkiem do `/signin`
2. Użyj Tailwind do stylizacji
3. Tekst: "Masz już konto? Zaloguj się"

**Oczekiwany rezultat:** Komponent nawigacyjny

---

### Krok 8: Implementacja endpoint POST /api/companies

**Lokalizacja:** `src/pages/api/companies/index.ts`

**Zadania:**

1. Utwórz plik z handlerami `GET` i `POST`
2. Implementuj `POST`:
   - Walidacja body przez Zod (pole `name`)
   - Pobieranie user ID z sesji Supabase (middleware)
   - Sprawdzenie czy użytkownik nie ma już firmy
   - Wstawienie nowego rekordu do tabeli `companies`
   - Powiązanie użytkownika z firmą (aktualizacja `users.company_uuid`)
   - Zwrot `CompanyDTO` (status 201)
3. Obsługa błędów:
   - 401 jeśli brak sesji
   - 409 jeśli firma już istnieje
   - 500 przy błędach bazy danych

**Oczekiwany rezultat:** Endpoint działający i obsługujący tworzenie firm

---

### Krok 9: Implementacja strony signup.astro

**Lokalizacja:** `src/pages/signup.astro`

**Zadania:**

1. Utwórz plik Astro analogicznie do `signin.astro`
2. Ustaw `export const prerender = false`
3. Pobierz i zwaliduj query param `returnTo`
4. Przekaż zmienne środowiskowe Supabase
5. Zaimplementuj layout:
   - Gradient background
   - Centrowany kontener
   - Hero sekcja z tytułem "RouteCheck"
   - `<SignUpFormCard>` z `client:only="react"`
6. Dodaj animację fadeIn (jak w `signin.astro`)

**Oczekiwany rezultat:** Strona `/signup` dostępna i działająca

---

### Krok 10: Aktualizacja nawigacji

**Zadania:**

1. Upewnij się, że link do `/signup` jest dostępny na stronie `/signin` (już istnieje w `SignInFooterLinks`)
2. Dodaj link do `/signup` w głównej nawigacji (jeśli ma być dostępny publicznie)

**Oczekiwany rezultat:** Użytkownik może łatwo nawigować między signin i signup

---

### Krok 11: Testy jednostkowe

**Lokalizacja:** `src/lib/auth/__tests__/`, `src/components/auth/__tests__/`

**Zadania:**

1. Testy dla `useSignUp`:
   - Pomyślna rejestracja
   - Błąd email już istnieje
   - Błąd słabe hasło
   - Błąd rate limiting
   - Błąd utworzenia firmy
2. Testy dla `usePasswordStrength`:
   - Różne scenariusze siły hasła
3. Testy dla `signUpFormSchema`:
   - Walidacja wszystkich pól
   - Refine dla confirmPassword
4. Testy dla komponentów:
   - `PasswordStrengthIndicator` – renderowanie dla różnych siły
   - `SignUpForm` – walidacja, submit, błędy
   - `SignUpFooterLinks` – renderowanie linku

**Oczekiwany rezultat:** Pokrycie testami kluczowych funkcjonalności

---

### Krok 12: Testy E2E (opcjonalne)

**Zadania:**

1. Test happy path:
   - Otwarcie `/signup`
   - Wypełnienie formularza poprawnymi danymi
   - Submit
   - Oczekiwanie przekierowania do `/dashboard`
2. Test błędu email już istnieje:
   - Próba rejestracji z istniejącym emailem
   - Oczekiwanie alertu błędu
3. Test walidacji:
   - Submit z pustymi polami
   - Oczekiwanie komunikatów błędów

**Oczekiwany rezultat:** E2E testy pokrywające główne ścieżki

---

### Krok 13: Dokumentacja

**Zadania:**

1. Dodaj komentarze JSDoc do wszystkich publicznych funkcji i komponentów
2. Zaktualizuj README jeśli potrzeba
3. Zapisz przykłady użycia API w dokumentacji

**Oczekiwany rezultat:** Kod dobrze udokumentowany

---

### Krok 14: Code review i refaktoryzacja

**Zadania:**

1. Przejrzyj kod pod kątem spójności ze stylem projektu
2. Sprawdź dostępność (ARIA, keyboard navigation)
3. Przetestuj responsywność (mobile, tablet, desktop)
4. Sprawdź czy błędy są dobrze obsługiwane
5. Zweryfikuj czy wszystkie stringi są po polsku

**Oczekiwany rezultat:** Kod production-ready

---

### Krok 15: Deployment i monitorowanie

**Zadania:**

1. Deploy na środowisko staging
2. Manualne testy na staging
3. Sprawdź logi i telemetrię
4. Deploy na produkcję
5. Monitoruj metryki (konwersja rejestracji, błędy)

**Oczekiwany rezultat:** Widok rejestracji w pełni działający na produkcji

---

## Podsumowanie

Powyższy plan szczegółowo opisuje implementację widoku rejestracji dla aplikacji RouteCheck. Widok jest zoptymalizowany pod kątem UX, dostępności i bezpieczeństwa. Wykorzystuje Supabase Auth do zarządzania użytkownikami oraz dedykowane API do tworzenia firm. Wszystkie komponenty są typu React, zarządzanie stanem oparte na TanStack Query, a walidacja realizowana przez React Hook Form + Zod.

Implementacja powinna zająć ok. 2-3 dni pracy dla doświadczonego frontend developera, włączając testy i dokumentację.
