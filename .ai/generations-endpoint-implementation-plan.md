## API Endpoint Implementation Plan: POST /api/public/report-links/{token}/reports

### 1. Przegląd punktu końcowego

Publiczny punkt końcowy służący do jednorazowego złożenia dziennego raportu przez kierowcę na podstawie tokenu w linku. Realizuje przepływ: walidacja tokenu → walidacja danych → utworzenie rekordu `reports` → oznaczenie linku jako zużytego → odpowiedź z `editableUntil`. Operuje na uprawnieniach service-role po stronie serwera, nie ujawnia prywatnych danych ani sekretów do klienta.

### 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/public/report-links/{token}/reports`
- **Parametry**:
  - **Wymagane (path)**:
    - `token`: surowy jednorazowy token (niehashowany) zawarty w linku.
  - **Opcjonalne (query)**: brak
- **Request Body (JSON)**: `PublicReportSubmitCommand`
  - Pola:
    - `routeStatus`: "COMPLETED" | "PARTIALLY_COMPLETED" | "CANCELLED"
    - `delayMinutes`: number ≥ 0
    - `delayReason`: string | null (wymagane, jeśli `delayMinutes` > 0)
    - `cargoDamageDescription`: string | null
    - `vehicleDamageDescription`: string | null
    - `nextDayBlockers`: string | null
    - `timezone`: string (IANA TZ, np. "Europe/Warsaw")
- **Nagłówki**:
  - Brak wymaganego Bearer JWT (publiczny); endpoint działa wyłącznie po stronie serwera z clientem service-role.
  - CORS ograniczony do domeny aplikacji (wg reguł public endpoints).

### 3. Wykorzystywane typy

- Z `src/types.ts`:
  - `PublicReportSubmitCommand`
  - `PublicReportSubmitResponseDTO`
  - `ReportRouteStatus` (enum)
  - `IsoDateString`
  - `Uuid`

### 3. Szczegóły odpowiedzi

- **201 Created**
  - Body (`PublicReportSubmitResponseDTO`):
    ```json
    { "reportUuid": "uuid", "editableUntil": "2025-01-01T21:10:00Z" }
    ```
- Kody błędów:
  - **400 Bad Request**: nieprawidłowe dane wejściowe (schemat/zasady biznesowe).
  - **404 Not Found**: token nieznany.
  - **409 Conflict**: token już użyty lub duplikat raportu `(driver_uuid, report_date)`.
  - **410 Gone**: token wygasł.
  - **429 Too Many Requests**: limitowanie IP/tokenu.
  - **500 Internal Server Error**: błąd serwera.

### 4. Przepływ danych

1. Wejście: `{token}` w ścieżce, body `PublicReportSubmitCommand`.
2. Hashowanie tokenu: `hashed = sha256(token + pepper)` (pepper z `import.meta.env`).
3. Odczyt `report_links` po `hashed_token`:
   - Jeśli brak → 404.
   - Jeśli `expires_at < now()` → 410.
   - Jeśli `used_at IS NOT NULL` → 409.
4. Walidacja body (Zod) i reguł biznesowych:
   - `routeStatus` ∈ ENUM
   - `delayMinutes ≥ 0`; gdy `> 0` → `delayReason` wymagane
   - dla `PARTIALLY_COMPLETED` → wymagane co najmniej jedno pole opisowe (`nextDayBlockers` lub inny opis)
   - `timezone` musi być prawidłowym IANA TZ
5. Wyznaczenie `report_date`:
   - Oblicz lokalną datę z `now()` w strefie `timezone` kierowcy (z requestu) i skonwertuj do `YYYY-MM-DD`.
6. Wyznaczenie `is_problem`:
   - true, jeśli `delayMinutes > 0` lub istnieje cargo/vehicle damage lub wypełnione `nextDayBlockers`; inaczej false.
7. Insert do `reports`:
   - Pola: `driver_uuid` (z linku), `company_uuid` (z linku), `report_date` (z 5), `timezone`, `occurred_at = now()`, `route_status`, `delay_minutes`, `delay_reason`, `cargo_damage_description`, `vehicle_damage_description`, `next_day_blockers`, `is_problem`.
   - Obsługa konfliktu unikalności `(driver_uuid, report_date)` → 409 z UUID istniejącego raportu (jeśli uzyskiwalny).
8. Aktualizacja `report_links.used_at = now()` (ten sam transakcyjny kontekst lub sekwencyjnie po udanym insert).
9. Wyznaczenie `editableUntil = occurred_at + 10 min` (z tolerancją serwera).
10. Zlecenie przetwarzania AI (asynchroniczne requeue): np. wywołanie edge function lub wpis do kolejki (out of scope implementacyjnie, ale wywołanie hooka przewidziane).
11. Wyjście 201 z `{ reportUuid, editableUntil }`.

### 5. Względy bezpieczeństwa

- Publiczny endpoint działa wyłącznie na serwerze z klientem Supabase w trybie service-role; sekrety nie trafiają do przeglądarki.
- Tokeny: nigdy nie przechowywać surowego tokenu; porównanie po `sha256(token + pepper)`.
- Pepper z bezpiecznej konfiguracji (`import.meta.env.PRIVATE_TOKEN_PEPPER`).
- RLS: operujemy poza RLS (service-role) dla publicznego przepływu, ale wstawiane rekordy muszą mieć poprawne `company_uuid` i `driver_uuid` z linku.
- Rate limiting: kube/edge-level + aplikacyjny (IP + token): 30/min/IP, 5/min/token.
- Walidacja długości i sanitacja pól tekstowych (limity, np. ≤ 2000 znaków).
- Logowanie bez PII/tokenów; brak wycieku `hashed_token`.
- CORS zawężony do domeny aplikacji.
- CSRF nie dotyczy, ponieważ używamy wyłącznie żądań z nagłówkami JSON i bez cookies sesyjnych; endpoint oparty na tokenie w URL.

### 6. Obsługa błędów

- Mapowanie:
  - 404 `not_found`: brak linku.
  - 410 `gone`: link wygasł.
  - 409 `conflict`: link użyty; lub konflikt `(driver_uuid, report_date)`.
  - 400 `validation_error`: błędny schemat/niezgodność reguł biznesowych (np. `delayReason` brak przy `delayMinutes>0`).
  - 429 `rate_limited`: przekroczony limit.
  - 500 `internal_error`: nieoczekiwany błąd.
- Format błędu (`ProblemDetail`):
  ```json
  { "code": "string", "message": "human readable", "details": { "field": "problem" } }
  ```
- Rejestrowanie błędów: strukturalne logi serwera (bez PII, bez tokenów). Brak dedykowanej tabeli błędów w MVP; nie wykorzystujemy `email_logs` do logów błędów.

### 7. Rozważania dotyczące wydajności

- Odczyt linku po `hashed_token` → unikalny indeks na kolumnie (w planie DB istnieje).
- Operacja insert do `reports` jest prosta i szybka; brak kosztownych joinów.
- Ewentualny konflikt `(driver_uuid, report_date)` obsłużony szybko przez indeks unikalny.
- Brak N+1. Pojedyncze zapytanie SELECT + INSERT (+ UPDATE).
- Asynchroniczne uruchomienie AI, bez blokowania ścieżki żądania.

### 8. Etapy wdrożenia

1. Routing i plik endpointu
   - Utwórz `src/pages/api/public/report-links/[token]/reports.ts`.
   - Dodaj `export const prerender = false`.
   - Zaimplementuj `export async function POST(context)`.
2. Klienci Supabase
   - W `src/db/supabase.client.ts` zapewnij fabryki:
     - Klient service-role (z `SERVICE_ROLE_KEY`) do publicznych endpointów.
   - W endpointach publicznych używaj klienta service-role z serwera (nie z `locals` JWT).
3. Walidacja wejścia (Zod)
   - Zdefiniuj `publicReportSubmitSchema` z regułami:
     - `routeStatus` enum z `report_route_status`.
     - `delayMinutes` ≥ 0; jeśli >0 → `delayReason` required.
     - Dla `PARTIALLY_COMPLETED` → co najmniej jedno pole opisowe.
     - `timezone` – IANA TZ (sprawdzenie przez whitelistę lub lib).
4. Logika serwisowa (wydzielenie)
   - `src/lib/services/reportLinksService.ts`:
     - `hashToken(rawToken: string, pepper: string): string`
     - `getValidLinkOrThrow(hashed: string, now: Date): { uuid, driver_uuid, company_uuid, expires_at, used_at }`
     - `markLinkUsed(linkUuid: Uuid, at: Date): Promise<void>`
   - `src/lib/services/reportsService.ts`:
     - `deriveReportDate(nowUtc: Date, timezone: string): string /* YYYY-MM-DD */`
     - `computeIsProblem(payload): boolean`
     - `createReportFromPublic(linkCtx, payload): Promise<{ uuid: Uuid, occurredAt: string }>`
     - `scheduleAiReprocess(reportUuid: Uuid): Promise<void>` (stub/edge function invoke)
5. Przepływ w handlerze
   - Parsowanie `{ token }` z path.
   - Hashowanie tokenu z pepperem.
   - Pobranie i walidacja linku; mapowanie błędów 404/410/409.
   - Parsowanie i walidacja body (Zod) + reguły biznesowe.
   - Wyznaczenie `report_date` i `is_problem`.
   - Insert `reports`; obsługa 409 przy duplikacie (zwrócić konflikt).
   - Ustawienie `used_at`.
   - Wyliczenie `editableUntil` = `occurred_at + 10 min`.
   - Uruchomienie `scheduleAiReprocess`.
   - Zwrócenie 201 z `PublicReportSubmitResponseDTO`.
6. Rate limiting
   - Dodaj middleware lub lokalny limiter (IP + token) zgodnie z §3 planu API.
7. Testy i weryfikacja
   - Testy jednostkowe: serwisy (`hashToken`, walidacje, `deriveReportDate`, `computeIsProblem`).
   - Testy integracyjne endpointu: ścieżki 201/400/404/409/410.
   - Smoke test z prawidłowym tokenem i payloadem.
8. DevOps i konfiguracja
   - Zmienne środowiskowe: `PRIVATE_TOKEN_PEPPER`, `SUPABASE_SERVICE_ROLE_KEY`.
   - CORS dla ścieżek `/api/public/**`.
   - Obserwowalność: strukturalne logi; dashboard błędów (opcjonalnie).

### Założenia i notatki implementacyjne (Astro + Supabase)

- Endpoint w `src/pages/api/public/**`; handler `POST` (wielkie litery).
- Brak `prerender`; SSR-only.
- Klient Supabase (service-role) instancjonowany wyłącznie na serwerze.
- Konsekwentny model błędów `ProblemDetail`.
- Brak podwójnego zużycia linku – oznaczaj `used_at` po udanym wstawieniu (ew. transakcja).
