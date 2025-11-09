# Architektura UI dla RouteLog MVP

## 1. Przegląd struktury UI

- Interfejs dzieli się na dwie główne ścieżki: panel spedytora (po zalogowaniu) w układzie desktop-first z responsywnym layoutem oraz publiczny formularz kierowcy zoptymalizowany pod urządzenia mobilne i offline-first.
- `AuthenticatedLayout` zapewnia spójny szkielet (sidebar desktop / bottom-nav mobile), utrzymuje kontekst użytkownika Supabase, obsługuje guard przed nieautoryzowanym dostępem oraz przekazuje dane firmy do podrzędnych widoków.
- Struktura IA opiera się na sekcjach: `Dashboard`, `Kierowcy`, `Raporty`, `Ustawienia`; dodatkowe moduły (`Pojazdy`, `Przypisania`) pozostają pod kontrolą flag funkcjonalnych.
- Widoki korzystają z Astro + React islands; stan danych oparty na TanStack Query z polityką stale-while-revalidate oraz integracją z endpointami Supabase REST.
- Spójny system komponentów (Tailwind 4 + shadcn/ui) wspiera kontrast, fokus, ARIA oraz tokeny kolorystyczne dla poziomów ryzyka; globalna warstwa powiadomień Sonner informuje o sukcesach/błędach.
- Warstwa bezpieczeństwa obejmuje: wykorzystanie Supabase JWT z RLS, obsługę kodów błędów API, tokeny jednorazowe w SessionStorage, brak ekspozycji klucza service-role oraz kontrolę CORS w middleware.

## 2. Lista widoków

### Panel logowania
- **Ścieżka:** `/signin`
- **Główny cel:** Autoryzacja spedytora z użyciem Supabase Auth.
- **Kluczowe informacje:** Pola e-mail i hasło, link do przypomnienia hasła (opcjonalnie), komunikaty o błędach (401, 429), status systemowy.
- **Kluczowe komponenty:** Formularz z walidacją, przycisk `Zaloguj`, spinner ładowania, toast błędu.
- **UX/A11y/Security:** Fokus początkowy na polu e-mail, obsługa Enter, ARIA `aria-invalid`, blokowanie wielokrotnych prób; po 401 odśwież token i pokaż redirect; transmisja po HTTPS.
- **Powiązane historyjki:** US-002.
- **Powiązane wymagania:** FR-01, FR-02.
- **Powiązane endpointy:** Supabase Auth SDK (`signInWithPassword`).

### Rejestracja firmy
- **Ścieżka:** `/signup` (opcjonalnie dostępna publicznie lub tylko w trybie onboarding).
- **Główny cel:** Utworzenie konta firmowego i pierwszego użytkownika.
- **Kluczowe informacje:** Formularz nazwa firmy + e-mail, potwierdzenie utworzenia konta, wskazówki dotyczące łączenia z Supabase.
- **Kluczowe komponenty:** Formularz, walidacja nazwy, baner informacyjny, link „Masz już konto?”.
- **UX/A11y/Security:** Walidacja inline, informacja o polityce haseł Supabase, blokada wielokrotnych rejestracji; komunikaty w ARIA live region.
- **Powiązane historyjki:** US-001.
- **Powiązane wymagania:** FR-01.
- **Powiązane endpointy:** Supabase Auth (`signUp`), `/api/companies/me` po zalogowaniu dla potwierdzenia.

### AuthenticatedLayout
- **Ścieżka:** Shell dla `/dashboard`, `/drivers`, `/reports`, `/settings`, flagowanych modułów.
- **Główny cel:** Zapewnienie wspólnego layoutu i guardu; dostarczenie kontekstu użytkownika i nawigacji.
- **Kluczowe informacje:** Nazwa firmy, aktualny użytkownik, wskaźnik sieci, slot na treść, fallback offline.
- **Kluczowe komponenty:** Sidebar (desktop), top bar + hamburger (mobile), bottom navigation, `UserMenu`, `Breadcrumbs`, `ErrorBoundary`.
- **UX/A11y/Security:** Nawigacja klawiaturą, wskaźnik aktywnej trasy, zachowanie focusu przy zmianie widoku, automatyczny redirect na `/signin` przy utracie sesji (401 z API).
- **Powiązane historyjki:** US-002, US-012 (nawigacja do dashboardu).
- **Powiązane wymagania:** FR-01, FR-07.
- **Powiązane endpointy:** `/api/users/me`, `/api/companies/me`.

### Dashboard „Dzisiaj”
- **Ścieżka:** `/dashboard`
- **Główny cel:** Szybki przegląd statusu raportów bieżącego dnia i poziomów ryzyka.
- **Kluczowe informacje:** Łączna liczba aktywnych kierowców, wysłane/pending, rozkład ryzyka, lista oczekujących, ostatnia aktualizacja, skróty do działań.
- **Kluczowe komponenty:** `MetricsCard`, `RiskBadge`, lista `PendingDrivers`, tabela „Dzisiejsze raporty”, przycisk „Odśwież teraz”, badge połączenia (polling / realtime), skeletony.
- **UX/A11y/Security:** Auto-odświeżanie co 60 s (refetchInterval), manualne odświeżanie z blokadą spamowania, ARIA live dla aktualnych metryk, wskaźnik czasu ostatniego odświeżenia.
- **Powiązane historyjki:** US-012, US-014 (alerty monitorowane), US-011 (prezentacja ryzyka).
- **Powiązane wymagania:** FR-06, FR-07, FR-08, FR-11.
- **Powiązane endpointy:** `GET /api/reports/today/summary`, `GET /api/reports?from=today&to=today&includeAi=true`.

### Lista kierowców
- **Ścieżka:** `/drivers`
- **Główny cel:** Zarządzanie bazą kierowców (przegląd, filtrowanie, akcje CRUD).
- **Kluczowe informacje:** Imię i nazwisko, e-mail, strefa czasowa, status aktywności, powiązany pojazd, data dodania.
- **Kluczowe komponenty:** Tabela z sortowaniem i filtrem, pasek wyszukiwania, przełącznik „Pokaż nieaktywnych”, przycisk `+ Dodaj`, menu akcji w wierszu.
- **UX/A11y/Security:** Responsywne karty na mobile, focus trap w modalu, komunikaty 409 dla duplikatu e-mail, toast sukcesu, potwierdzenie przy zmianie aktywności.
- **Powiązane historyjki:** US-003, US-004, US-005.
- **Powiązane wymagania:** FR-02, FR-11.
- **Powiązane endpointy:** `GET/POST/PATCH/DELETE /api/drivers`.

### Modal dodawania/edycji kierowcy
- **Ścieżka:** Modal w `/drivers` (Shadcn Dialog / Sheet mobile).
- **Główny cel:** Dodanie lub edycja danych kierowcy z walidacją.
- **Kluczowe informacje:** Imię, e-mail, strefa czasowa (combobox), przełącznik aktywności, informacja o konfliktach.
- **Kluczowe komponenty:** Formularz React Hook Form + Zod, `TimezoneCombobox`, przyciski `Zapisz`/`Anuluj`, indykator ładowania.
- **UX/A11y/Security:** Walidacja opóźniona, focus trap, `aria-live` dla błędów, obsługa 409 (ustawienie błędu pod polem e-mail), ochrona przed utratą danych (confirm discard).
- **Powiązane historyjki:** US-003, US-004.
- **Powiązane wymagania:** FR-02.
- **Powiązane endpointy:** `POST /api/drivers`, `PATCH /api/drivers/{uuid}`.

### Potwierdzenie usunięcia kierowcy
- **Ścieżka:** Modal dialog w `/drivers`.
- **Główny cel:** Potwierdzenie soft-delete kierowcy z informacją o skutkach.
- **Kluczowe informacje:** Nazwa kierowcy, ostrzeżenie o zachowaniu historii, CTA `Usuń`, CTA `Anuluj`.
- **Kluczowe komponenty:** Dialog potwierdzenia, `DangerButton`, spinner.
- **UX/A11y/Security:** Fokus na przycisku anuluj, czytelne copy, potwierdzenie po 204 odpowiedzi, toast informacyjny; obsługa 409 jeżeli brak uprawnień.
- **Powiązane historyjki:** US-005.
- **Powiązane wymagania:** FR-02.
- **Powiązane endpointy:** `DELETE /api/drivers/{uuid}`.

### Historia raportów
- **Ścieżka:** `/reports`
- **Główny cel:** Przegląd raportów z możliwością filtrowania, wyszukiwania, eksportu.
- **Kluczowe informacje:** Filtrowalna lista raportów (data, kierowca, pojazd, status, opóźnienie, ryzyko, tagi), filtry (daty, kierowcy, ryzyko, status, wyszukiwarka `q`), paginacja cursorowa, info o liczbie wyników.
- **Kluczowe komponenty:** Pasek filtrów z `DateRangePicker`, `RiskFilter`, `StatusFilter`, `DriverMultiSelect`, `SearchInput`; tabela desktop, karty mobile; przyciski `Eksportuj CSV`, `+ Dodaj raport`.
- **UX/A11y/Security:** Synchronizacja stanu z URL (back/forward), skeletony, komunikaty pustej listy, debounce wyszukiwarki, guard 429 z informacją o limitach, paginacja dostępna klawiaturą.
- **Powiązane historyjki:** US-015, US-016, US-013 (wejście do formularza), US-011 (listy z AI).
- **Powiązane wymagania:** FR-06, FR-09, FR-10, FR-11.
- **Powiązane endpointy:** `GET /api/reports`, `GET /api/risk-tags` (prefetch tagów), `GET /api/drivers` (dla filtrów).

### Szczegóły raportu
- **Ścieżka:** `/reports/[uuid]` (modal nad listą lub osobny widok).
- **Główny cel:** Wgląd w szczegóły raportu, AI, możliwość ręcznej aktualizacji.
- **Kluczowe informacje:** Nagłówek (data, kierowca, pojazd, status), sekcja opóźnień, szkód, blockerów, AI summary + risk badge, lista tagów, historia zmian, editableUntil (jeśli publiczna edycja w toku), przycisk „Przeprocesuj AI”.
- **Kluczowe komponenty:** `ReportSummaryHeader`, `RiskBadge`, `DetailsAccordion`, `AITimeline`, `TagChips`, `HistoryLog`, `ActionBar`.
- **UX/A11y/Security:** Polling co 5 s dopóki AI `null`, wskaźnik „AI w toku”, potwierdzenie reprocess (202), komunikaty 409 (duplikat), 404 (usunięty), focus mgmt przy otwieraniu modalu, zabezpieczenie przed przypadkową edycją (rola admin).
- **Powiązane historyjki:** US-011, US-013, US-020.
- **Powiązane wymagania:** FR-06, FR-09, FR-13 (manual edit), FR-05 (monitoring editableUntil).
- **Powiązane endpointy:** `GET /api/reports/{uuid}?includeAi=true&includeTags=true`, `GET /api/reports/{uuid}/ai`, `POST /api/reports/{uuid}/ai/reprocess`, `PATCH /api/reports/{uuid}`.

### Formularz manualnego raportu
- **Ścieżka:** Modal lub `/reports/new`.
- **Główny cel:** Dodanie raportu przez spedytora (US-013).
- **Kluczowe informacje:** Selektor kierowcy, data raportu, status trasy, pola problemów (opóźnienia, powód, szkody, blokery), tagi ryzyka, opcjonalny poziom ryzyka, strefa czasowa.
- **Kluczowe komponenty:** `DriverSelect`, `DatePicker`, `StatusRadioGroup`, dynamiczne sekcje, `TagMultiSelect`, walidacja Zod (delayReason required, komentarz przy partial).
- **UX/A11y/Security:** Formularz prewalidowany, podpowiedzi, uproszczony happy path (COMPLETED -> minimalne pola), offline detekcja, toast sukcesu i link do szczegółów; obsługa 409 gdy raport istnieje (link do istniejącego).
- **Powiązane historyjki:** US-013, US-020.
- **Powiązane wymagania:** FR-04, FR-13, FR-06.
- **Powiązane endpointy:** `POST /api/reports`.

### Modal eksportu CSV
- **Ścieżka:** Modal w `/reports`.
- **Główny cel:** Przygotowanie i pobranie pliku CSV z raportami.
- **Kluczowe informacje:** Zakres dat (obowiązkowy), checkboxy `Uwzględnij AI`, `Uwzględnij tagi`, status przygotowania pliku, informacja o limicie zakresu i czasie.
- **Kluczowe komponenty:** `DateRangePicker`, przełączniki, progress bar, komunikaty, przycisk `Pobierz`.
- **UX/A11y/Security:** Walidacja natychmiastowa (zakres ≤31 dni), obsługa stanu „przygotowuję”, fallback przy 413 (komunikat), generowanie nazwy pliku, informacja o wrażliwości danych, focus trap.
- **Powiązane historyjki:** US-016.
- **Powiązane wymagania:** FR-10.
- **Powiązane endpointy:** `GET /api/reports/export.csv`.

### Ustawienia – profil firmy
- **Ścieżka:** `/settings/profile`
- **Główny cel:** Zarządzanie podstawowymi danymi firmy.
- **Kluczowe informacje:** Nazwa firmy, identyfikator, data utworzenia, informacja o planie, link do pomocy.
- **Kluczowe komponenty:** Formularz edycji nazwy, `InfoCard`, przycisk `Zapisz`, sekcja „Dane konta”.
- **UX/A11y/Security:** Potwierdzenie zmian (toast), walidacja długości, informacja o widoczności (tylko administrator), 403 -> baner.
- **Powiązane historyjki:** US-001 (utrzymanie danych firmy).
- **Powiązane wymagania:** FR-01.
- **Powiązane endpointy:** `GET /api/companies/me`, `PATCH /api/companies/me`.

### Ustawienia – alerty i telemetria
- **Ścieżka:** `/settings/alerts`
- **Główny cel:** Konfiguracja alertów e-mail i wgląd w telemetrię UX.
- **Kluczowe informacje:** Stan alertu 24h (włącz/wyłącz), adres docelowy (info-only, bo jedno konto), ostatnie wysłane alerty (link do email logs), wgląd w agregaty telemetryczne (czas wypełnienia formularza).
- **Kluczowe komponenty:** `ToggleCard`, `InfoBanner`, mini wykres (opcjonalnie), link do `email_logs`.
- **UX/A11y/Security:** Kopie opisujące konsekwencje, 202 feedback, dostęp tylko po uwierzytelnieniu; 429 -> komunikat limit.
- **Powiązane historyjki:** US-014, US-017.
- **Powiązane wymagania:** FR-08, FR-11.
- **Powiązane endpointy:** `POST /api/report-links:generate` (ręczne uruchomienie, jeśli udostępnione), `GET /api/email-logs` (opcjonalne), `GET /api/telemetry` (jeśli włączone).

### Ustawienia – konto i sesja
- **Ścieżka:** `/settings/account`
- **Główny cel:** Zarządzanie sesją Supabase i wylogowaniem.
- **Kluczowe informacje:** Adres e-mail użytkownika, status sesji, przycisk `Wyloguj`, informacja o automatycznym wygaśnięciu 24h.
- **Kluczowe komponenty:** `SessionCard`, `LogoutButton`, `SecurityTips`.
- **UX/A11y/Security:** Potwierdzenie wylogowania, ostrzeżenie przy 24h braku aktywności, informacja o logach audytowych.
- **Powiązane historyjki:** US-002.
- **Powiązane wymagania:** FR-01.
- **Powiązane endpointy:** Supabase Auth (`signOut`), `/api/users/me`.

### Pojazdy (feature flag)
- **Ścieżka:** `/vehicles`
- **Główny cel:** (Jeśli odblokowane) zarządzanie flotą.
- **Kluczowe informacje:** Numer rejestracyjny, VIN, status aktywności, przypisania, data utworzenia.
- **Kluczowe komponenty:** Tabela/karty, modal dodawania/edycji, potwierdzenie usunięcia, filtry.
- **UX/A11y/Security:** Flagowane, informacja gdy niedostępne, obsługa 409 dla duplikatów, fokus trap, toasty.
- **Powiązane historyjki:** (przyszłe) powiązane z US-003 wariancja.
- **Powiązane wymagania:** FR-02 rozszerzone (pojazd).
- **Powiązane endpointy:** `GET/POST/PATCH/DELETE /api/vehicles`.

### Przypisania kierowca–pojazd (feature flag)
- **Ścieżka:** `/assignments`
- **Główny cel:** Zarządzanie harmonogramem przypisań z walidacją zakładek dat.
- **Kluczowe informacje:** Driver, vehicle, zakres dat, status aktywny, konflikty.
- **Kluczowe komponenty:** Lista timeline, formularz dat, walidacja konfliktów, komunikat 409 z informacją o nakładaniu.
- **UX/A11y/Security:** Czytelny komunikat błędu, focus trap, możliwość widoku kalendarza, informacja o strefach czasowych.
- **Powiązane historyjki:** Przyszłe (rozszerzenie logistyki).
- **Powiązane wymagania:** FR dot. przypisań (z dokumentacji planu API).
- **Powiązane endpointy:** `GET/POST/PATCH/DELETE /api/assignments`.

### Publiczny formularz raportu
- **Ścieżka:** `/public/report-links/[token]`
- **Główny cel:** Umożliwić kierowcy szybkie zgłoszenie statusu trasy.
- **Kluczowe informacje:** Imię kierowcy, pojazd, czas wygaśnięcia linku, przełącznik „Wszystko OK” vs „Problem”, dynamiczne pola problemów, licznik czasu wypełnienia.
- **Kluczowe komponenty:** `TokenGuard`, `StatusSwitch`, `DynamicFormSections`, `OfflineBanner`, `Countdown`, `SubmitButton`, telemetry hooks.
- **UX/A11y/Security:** Mobile-first, duże hit area, offline queue w service worker, walidacja (delayReason required), feedback 404/409/410, `aria-live` dla błędów, ochrona przed duplikatem (token w SessionStorage), brak third-party scriptów.
- **Powiązane historyjki:** US-007, US-008, US-009, US-010, US-019, US-020, US-017.
- **Powiązane wymagania:** FR-03, FR-04, FR-05, FR-06, FR-11.
- **Powiązane endpointy:** `GET /api/public/report-links/{token}`, `POST /api/public/report-links/{token}/reports`, `POST /api/telemetry`.

### Publiczne potwierdzenie + edycja
- **Ścieżka:** `/public/report-links/[token]/success` (lub stan w tej samej stronie po POST).
- **Główny cel:** Potwierdzenie wysłania raportu i umożliwienie edycji w limicie 10 min.
- **Kluczowe informacje:** Komunikat sukcesu, `editableUntil`, licznik, przycisk „Edytuj raport”, informacja o ponownym przetwarzaniu AI, ostrzeżenie po upływie czasu.
- **Kluczowe komponenty:** `SuccessCard`, `CountdownTimer`, `EditButton`, `StatusBanner`.
- **UX/A11y/Security:** Countdown w ARIA live polite, token przechowywany w SessionStorage (pod kluczem powiązanym z reportUuid), disable przycisku po 0, obsługa 409 (baner „Edycja niedostępna”), offline guard.
- **Powiązane historyjki:** US-009, US-011.
- **Powiązane wymagania:** FR-05, FR-06.
- **Powiązane endpointy:** `PATCH /api/public/reports/{uuid}`, `GET /api/public/report-links/{token}` (rewalidacja).

### Publiczny widok błędu tokenu
- **Ścieżka:** `/public/report-links/[token]/error`
- **Główny cel:** Wyświetlenie jasnego komunikatu dla wygasłych, zużytych lub błędnych tokenów.
- **Kluczowe informacje:** Typ błędu (404/409/410), zalecane działania (kontakt z spedytorem), link `Spróbuj ponownie` (odśwież).
- **Kluczowe komponenty:** `ErrorIllustration`, `ActionButtons`, `ContactCard`.
- **UX/A11y/Security:** Kopie dostosowane do kodów HTTP, brak ujawnienia danych po terminie, wstecz dostępne, aria-live do komunikatu, telemetry event `TOKEN_INVALID`.
- **Powiązane historyjki:** US-010, US-019.
- **Powiązane wymagania:** FR-03, FR-04.
- **Powiązane endpointy:** `GET /api/public/report-links/{token}` (obsługa błędu).

### Widoki błędów globalnych
- **Ścieżka:** `/404`, `/500`, fallback w ErrorBoundary.
- **Główny cel:** Przyjazne komunikaty o błędach i odzyskanie nawigacji.
- **Kluczowe informacje:** Komunikat, CTA `Wróć do dashboardu` lub `Zaloguj ponownie`, numer wsparcia.
- **Kluczowe komponenty:** `ErrorState`, `PrimaryButton`, `SecondaryLink`.
- **UX/A11y/Security:** ARIA `role="alert"`, jasny język, brak ujawniania szczegółów serwera, logowanie telemetry `APP_ERROR`.
- **Powiązane historyjki:** US-010 (narracja), US-012 (w razie błędów dashboardu).
- **Powiązane wymagania:** FR-11 (telemetria błędów).
- **Powiązane endpointy:** brak (obsługa UI).

## 3. Mapa podróży użytkownika

- **Onboarding spedytora (US-001 → US-003):** `Rejestracja` → przekierowanie do `Panel logowania` → `AuthenticatedLayout` ładuje kontekst → baner „Dodaj pierwszego kierowcę” → `Lista kierowców` z pustym stanem → `Modal dodawania kierowcy` → lista aktualizuje się optimistic → CTA przejścia na `Dashboard`.
- **Codzienna praca spedytora (US-012, US-015, US-016, US-013):** Po zalogowaniu `Dashboard` auto-odświeża metryki → kliknięcie w sekcję „Oczekujące” przechodzi do filtrowanych `Raportów` → z listy otwarcie `Szczegółów raportu` → ewentualne `Formularz manualny` lub edycja → toast i powrót do listy z rewalidacją → `Modal eksportu CSV` uruchamiany z paska filtrów → pobranie pliku i powrót do pracy.
- **Obsługa alertów i ustawień (US-014, US-017):** Z `Dashboard` dostęp do `Ustawień` przez menu użytkownika → `Ustawienia – alerty` umożliwiają włączenie/wyłączenie powiadomień, podgląd ostatnich wysyłek → (opcjonalnie) link do logów e-mail; sekcja telemetrii pokazuje medianę czasu wypełnienia i zachęca do iteracji formularza.
- **Ścieżka kierowcy (US-007 → US-009):** Kierowca otrzymuje wiadomość z linkiem → otwiera `Publiczny formularz`, który waliduje token (GET) → w trybie „Wszystko OK” jedno kliknięcie wysyła raport (POST) → przejście do `Publicznego potwierdzenia` z countdown → ewentualna edycja (PATCH) do czasu wygaśnięcia → po 409 widok `Publiczny błąd`. Telemetria rejestruje czas i konwersję (POST `/api/telemetry`).
- **Scenariusze brzegowe:** Offline lub utrata sieci w formularzu uruchamia kolejkę offline i baner; 429/500 w panelu generują toasty i stan fallback (retry, skeleton). Utrata sesji w panelu przenosi do `/signin` z komunikatem.
- **Rozwiązania punktów bólu:** Dashboard oferuje ręczne odświeżenie i badge stanu realtime, by ograniczyć niepewność; raporty mają filtrowanie w URL, by ułatwić współdzielenie widoków; formularz kierowcy ma proste copy i minimalną liczbę pól w happy path; countdown i banery jasno komunikują dostępność edycji, minimalizując frustrację.

## 4. Układ i struktura nawigacji

- **Nawigacja główna (desktop):** Stały sidebar z logo RouteLog, listą głównych sekcji (`Dashboard`, `Kierowcy`, `Raporty`, `Ustawienia`); obok ikona statusu połączenia. Sekcje flagowane (`Pojazdy`, `Przypisania`) ukryte lub oznaczone etykietą „Wkrótce”.
- **Nawigacja mobilna:** Top-bar z tytułem widoku i kontekstowym działaniem, dolny pasek z czterema zakładkami (`Dashboard`, `Kierowcy`, `Raporty`, `Więcej`). Zakładka `Więcej` wysuwa sheet z `Ustawieniami`, `Wyloguj`, opcjonalnymi modułami.
- **Nawigacja podrzędna:** W `Raportach` użycie breadcrumbs i zakładek (np. „Lista” vs „Analiza” w przyszłości). W `Ustawieniach` karty (tabs) `Profil`, `Alerty`, `Konto`.
- **Kontrola uprawnień:** Guard w middleware przekierowuje niezalogowanych na `/signin`; zapamiętuje żądany URL dla powrotu. Publiczne ścieżki ignorują layout i nie zawierają nawigacji aplikacji.
- **Wskaźniki stanu:** Na wszystkich ekranach dostępny jest globalny wskaźnik offline/online, toasty w prawym dolnym rogu (desktop) / górnym (mobile). Breadcrumbs wspierają powrót do list bez utraty filtrów (history state).

## 5. Kluczowe komponenty

- **AuthenticatedLayout** – odpowiada za shell, guard, przekazywanie kontekstu użytkownika i Supabase client; zarządza sidebar/topbar/bottom-nav.
- **MetricsCard & RiskBadge** – wyświetlają metryki i poziomy ryzyka z kolorystyką dostosowaną do WCAG; używane na dashboardzie, listach raportów i szczegółach.
- **FiltersBar (Raporty)** – zunifikowany pasek filtrów (daty, status, ryzyko, kierowca, wyszukiwarka) z synchronizacją URL; dostępny również w `Drivers` (z ograniczonym zestawem).
- **ReportTable / ReportCard** – responsywna prezentacja raportów (tabela desktop, karty mobile) współdzieląca logikę kolumn (status, opóźnienia, AI).
- **DriverFormModal & ReportFormModal** – komponenty formularzy z React Hook Form + Zod; wspierają walidacje biznesowe, toasty, optimistic updates.
- **CountdownTimer** – liczy czas do `editableUntil`; ARIA live updates, używany w publicznym potwierdzeniu i ewentualnie w panelu (monitoring edycji).
- **OfflineBanner & RetryQueue** – komunikują brak połączenia, przechowują żądania publicznego formularza w IndexedDB, automatycznie wysyłają po odzyskaniu sieci.
- **Toasts (Sonner)** – warstwa notyfikacji o sukcesach/błędach; integrowana z interceptorami API i formularzami.
- **ErrorBoundary & ErrorState** – przechwytują błędy renderowania, oferują CTA do odświeżenia lub powrotu.
- **TelemetryHook (`useTelemetry`)** – wysyła zdarzenia na `/api/telemetry` (np. czas wypełnienia formularza, niepowodzenia tokenu), wykorzystywany w publicznym flow i w panelu (np. monitorowanie eksportu).


