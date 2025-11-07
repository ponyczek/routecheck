```markdown
# Dokument wymagań produktu (PRD) – RouteLog MVP

## 1. Przegląd produktu

RouteLog to lekka aplikacja webowa (SaaS) wspierająca małe i średnie firmy transportowe w automatycznym zbieraniu krótkich, ustandaryzowanych raportów dziennych od kierowców. System generuje jednorazowe linki wysyłane e-mailem, pozwala kierowcy zgłosić status trasy jednym kliknięciem, a następnie tworzy streszczenie oparte na AI z oceną ryzyka. Spedytorzy otrzymują widok „Dzisiaj”, historię siedmiu dni i eksport CSV. MVP koncentruje się na prostocie procesu i wysokiej konwersji link → pełny raport.

## 2. Problem użytkownika

1. Spedytorzy nie mają szybkiego, standaryzowanego sposobu na uzyskanie informacji „dlaczego” wystąpiły opóźnienia lub szkody.
2. Wieczorne rozmowy telefoniczne z kierowcami są czasochłonne i nie pozostawiają śladu w systemie.
3. Telematyka odpowiada tylko na pytanie „gdzie i kiedy”, a nie „dlaczego”.
4. Brak spójnego formatu raportu utrudnia analizę i archiwizację danych.

## 3. Wymagania funkcjonalne

| ID    | Opis funkcji                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------- |
| FR-01 | Uwierzytelnianie: rejestracja i logowanie jednego konta firmowego (współdzielonego).               |
| FR-02 | CRUD kierowców: dodawanie, edycja, usuwanie, lista (imię, numer pojazdu).                          |
| FR-03 | Codzienne automatyczne generowanie i wysyłka jednorazowego linku (token, ważność 24 h).            |
| FR-04 | Publiczny formularz raportu z logiką: „Wszystko OK” → 1 klik kontra „Problem” → pola szczegółowe.  |
| FR-05 | Edycja raportu przez kierowcę do 10 min po wysłaniu.                                               |
| FR-06 | AI-podsumowanie (2-3 zdania PL), klasyfikacja ryzyka (Brak/Niskie/Średnie/Wysokie), tagi przyczyn. |
| FR-07 | Dashboard „Dzisiaj”: status raportów, badge ryzyka, sekcja „Oczekujące”.                           |
| FR-08 | Alert e-mail do spedytora, jeśli raport nie nadejdzie w 24 h od planowanego terminu.               |
| FR-09 | Historia ostatnich 7 dni z sortowaniem i filtrowaniem po ryzyku.                                   |
| FR-10 | Eksport CSV (zakres dat, kluczowe pola + wyniki AI).                                               |
| FR-11 | Telemetria: pomiar czasu wypełnienia formularza, konwersja linków.                                 |
| FR-12 | CI/CD: min. jeden test (unit lub e2e) uruchamiany w GitHub Actions.                                |

## 4. Granice produktu

- Brak integracji z telematyką/TMS (poza ewentualnym ręcznym importem list tras).
- Komunikacja wyłącznie e-mail (bez SMS/WhatsApp); brak aplikacji mobilnych native.
- Brak załączników (zdjęcia, podpisy, geolokalizacja).
- Brak wielopoziomowych ról i multi-tenant (1 konto = 1 firma).
- Brak płatności i zaawansowanych raportów BI.
- Obsługa wyłącznie nowoczesnych mobilnych przeglądarek (Chrome, Safari, Edge – 2 ostatnie wersje).
- W UI wyświetlana jest tylko historia 7 dni; starsze dane dostępne wyłącznie w bazie lub CSV.

## 5. Historyjki użytkowników

### US-001 — Rejestracja konta firmowego

Opis: Jako przyszły użytkownik chcę utworzyć konto firmy, aby uzyskać dostęp do aplikacji.  
Kryteria akceptacji:

1. Formularz akceptuje nazwę firmy i e-mail.
2. Po rejestracji użytkownik może się zalogować.
3. Dostęp do aplikacji wymaga poprawnych danych logowania.

### US-002 — Logowanie

Opis: Jako spedytor chcę się zalogować, aby zarządzać kierowcami i raportami.  
Kryteria akceptacji:

1. System weryfikuje e-mail i hasło.
2. Po zalogowaniu widoczny jest dashboard „Dzisiaj”.
3. Sesja wygasa po 24 h braku aktywności.

### US-003 — Dodanie kierowcy

Opis: Jako spedytor chcę dodać kierowcę z imieniem i numerem pojazdu, aby system mógł wysyłać linki raportowe.  
Kryteria akceptacji:

1. Formularz waliduje brak duplikatów numeru pojazdu.
2. Kierowca pojawia się w liście bez odświeżania strony.
3. Dane są trwałe po ponownym logowaniu.

### US-004 — Edycja kierowcy

Opis: Jako spedytor chcę edytować dane kierowcy, aby utrzymać je w aktualności.  
Kryteria akceptacji:

1. Zmiana zapisuje się w bazie danych.
2. Lista odświeża się natychmiast.
3. Historia raportów kierowcy pozostaje nienaruszona.

### US-005 — Usunięcie kierowcy

Opis: Jako spedytor chcę usunąć kierowcę, aby lista zawierała tylko aktywnych pracowników.  
Kryteria akceptacji:

1. System wymaga potwierdzenia usunięcia.
2. Kierowca znika z listy oraz harmonogramu wysyłki linków.
3. Historyczne raporty pozostają widoczne.

### US-006 — Automatyczna wysyłka linku

Opis: Jako system chcę codziennie wysłać jednorazowy link do każdego aktywnego kierowcy, aby zebrać raport dzienny.  
Kryteria akceptacji:

1. Wysyłka uruchamia się o ustalonej godzinie (cron).
2. Link zawiera token ważny 24 h i dane kierowcy w treści e-maila.
3. Nie wysyła się drugi link w tym samym dniu.

### US-007 — Wypełnienie raportu – happy path

Opis: Jako kierowca chcę kliknąć „Wszystko OK”, aby błyskawicznie zakończyć raport, gdy nie ma problemów.  
Kryteria akceptacji:

1. Formularz ładuje się <2 s w sieci 4G.
2. Jedno kliknięcie zapisuje raport.
3. Ekran potwierdzenia wyświetla czas lokalny i informację o możliwości edycji przez 10 min.

### US-008 — Wypełnienie raportu – problemy

Opis: Jako kierowca chcę zgłosić opóźnienia, szkody lub blokery, aby spedytor wiedział, co się stało.  
Kryteria akceptacji:

1. Po wybraniu „Problem” pojawiają się pola: status trasy, opóźnienie [min] + powód, uszkodzenia ładunku, usterki pojazdu, blokery na jutro.
2. Walidacja wymaga co najmniej jednego powodu opóźnienia, gdy opóźnienie > 0.
3. Raport zapisuje się z kompletnym zestawem pól.

### US-009 — Edycja raportu (10 min)

Opis: Jako kierowca chcę poprawić raport w ciągu 10 min od wysłania, aby usunąć pomyłki.  
Kryteria akceptacji:

1. Link „Edytuj” aktywny dokładnie 10 min.
2. Po upływie czasu link zwraca informację „Edycja niedostępna”.
3. Po edycji AI-podsumowanie generuje się ponownie.

### US-010 — Obsługa wygasłego lub niepoprawnego tokenu

Opis: Jako kierowca chcę otrzymać jasny komunikat, gdy link jest nieważny, aby wiedzieć, co zrobić dalej.  
Kryteria akceptacji:

1. System rozróżnia wygasły, zużyty i błędny token.
2. Wyświetla komunikat oraz kontakt do spedytora.
3. Nie pozwala zapisać raportu.

### US-011 — AI-podsumowanie

Opis: Jako spedytor chcę otrzymać krótkie streszczenie i poziom ryzyka, aby szybciej ocenić sytuację.  
Kryteria akceptacji:

1. AI generuje streszczenie ≤30 s po zapisie raportu.
2. Poziom ryzyka należy do jednego z 4 stanów.
3. Tagi przyczyn pochodzą z listy kontrolowanej.

### US-012 — Dashboard „Dzisiaj”

Opis: Jako spedytor chcę widzieć, którzy kierowcy wysłali raport, a którzy nie, aby podjąć działania w ciągu dnia.  
Kryteria akceptacji:

1. Lista aktualizuje się automatycznie co 60 s lub po odświeżeniu strony.
2. Każdy raport ma badge z poziomem ryzyka.
3. Sekcja „Oczekujące” pokazuje kierowców bez raportu.

### US-013 — Ręczne dodanie raportu

Opis: Jako spedytor chcę ręcznie dodać lub poprawić raport, gdy kierowca podał informacje telefonicznie.  
Kryteria akceptacji:

1. Formularz dostępny tylko dla zalogowanych spedytorów.
2. Raport przechodzi ten sam proces AI-podsumowania.
3. Akcję loguje się w historii (user, data).

### US-014 — Alert e-mail po 24 h

Opis: Jako spedytor chcę otrzymać e-mail, jeśli raport nie został wysłany w ciągu 24 h od planowanego terminu, aby zareagować.  
Kryteria akceptacji:

1. Alert wysyła się raz na brakujący raport.
2. E-mail zawiera dane kierowcy i link do dashboardu.
3. Alert wyłącza się automatycznie po otrzymaniu raportu.

### US-015 — Historia 7 dni

Opis: Jako spedytor chcę przeglądać raporty z ostatnich 7 dni, aby analizować trendy.  
Kryteria akceptacji:

1. Widok pokazuje co najmniej 7 dni.
2. Można sortować po dacie i ryzyku.
3. Kliknięcie w raport otwiera jego szczegóły.

### US-016 — Eksport CSV

Opis: Jako spedytor chcę wyeksportować raporty do CSV za wybrany okres, aby analizować dane w innym narzędziu.  
Kryteria akceptacji:

1. Zakres dat jest obowiązkowy.
2. Plik zawiera wszystkie pola formularza i wyniki AI.
3. Nazwa pliku zawiera firmę i datę eksportu.

### US-017 — Telemetria UX

Opis: Jako product manager chcę mierzyć czas wypełnienia formularza, aby ocenić jego użyteczność.  
Kryteria akceptacji:

1. Frontend wysyła znaczniki start/stop do narzędzia analitycznego.
2. Dane można zagregować do mediany dziennej.
3. Dane nie zawierają PII.

### US-018 — Pipeline CI/CD

Opis: Jako zespół chcemy, aby każdy push uruchamiał testy, by zapobiegać regresjom.  
Kryteria akceptacji:

1. GitHub Actions uruchamia workflow na pull-request.
2. Build kończy się niepowodzeniem przy błędnym teście.
3. Status CI widoczny w PR.

### US-019 — Bezpieczny dostęp przez token

Opis: Jako właściciel firmy chcę, aby link był jednorazowy i nieidentyfikowalny, by chronić dane kierowców.  
Kryteria akceptacji:

1. Token jest losowy, 128-bitowy i jednorazowy.
2. Wygasa po 24 h lub po użyciu.
3. Nie pozwala odczytać danych innych kierowców.

### US-020 — Obsługa częściowo wykonanej trasy

Opis: Jako kierowca chcę oznaczyć trasę jako „Częściowo wykonano”, aby spedytor znał dokładny status.  
Kryteria akceptacji:

1. Pole statusu ma trzy wartości: Ukończono, Częściowo, Odwołano.
2. Przy „Częściowo” wymagany komentarz.
3. AI uwzględnia status w streszczeniu.

## 6. Metryki sukcesu

| ID    | Wskaźnik                                   | Cel MVP                      |
| ----- | ------------------------------------------ | ---------------------------- |
| MS-01 | Konwersja link → raport ≤24 h              | ≥ 70 %                       |
| MS-02 | Liczba wieczornych telefonów „co z trasą?” | − 30 % po 2 tyg. pilota      |
| MS-03 | Raporty z ryzykiem ≥ Średnie               | ≥ 1 dziennie / 10 kierowców  |
| MS-04 | Eksport CSV                                | ≥ 1 tygodniowo               |
| MS-05 | Mediana czasu wypełnienia formularza       | < 90 s                       |
| MS-06 | Stabilność HTTP                            | 99 % żądań 2xx               |
| MS-07 | Pokrycie testami krytycznej ścieżki        | 100 % workflow green na main |
```
