<conversation_summary>

<decisions>
1. Struktura multi-tenant „future-proof”: kolumna `company_uuid` w kluczowych tabelach + RLS per firma (w MVP działa 1 firma).  
2. Jednorazowe linki: tabela `report_links` (hashowany token 128-bit, `expires_at`, `used_at`) + purge po 90 dniach (`pg_cron`).  
3. Raport dzienny unikalny per `(driver_uuid, report_date)`.  
4. Silnie typowane pola raportu; `status_trasy` jako enum (`UKONCZONO`, `CZESCIOWO`, `ODWOLANO`).  
5. Edycja raportu ograniczona triggerem do 10 min od utworzenia.  
6. Wyniki AI w osobnej tabeli `report_ai_results`; `risk_level` także denormalizowane w `reports` dla wydajnych filtrów.  
7. Telemetria w `telemetry_events` (indeks `(event_type, occurred_at)`), zliczanie czasu i konwersji.  
8. Historia kierowca–pojazd: `vehicles` + `driver_vehicle_assignments` (okresy bez nakładania, `EXCLUDE USING gist`).  
9. Soft-delete (`deleted_at`) dla kierowców/pojazdów + indeksy częściowe na unikalnych atrybutach.  
10. Logi wysyłek `email_logs` do monitoringu SLA i alertów.  
11. Wyszukiwanie: `search_vector` (GIN) + indeksy zakresowe pod dashboard („Dziś”, „7 dni”).  
12. Supabase Auth: domenowe `users` mapowane do `auth.users`; operacje z publicznego linku przez edge function/RPC (brak DML przez `anon`).  
13. **[DOPRECYZOWANE]** Jeden login w obrębie firmy — brak wewnętrznego systemu ról na MVP.  
14. **[DOPRECYZOWANE]** Tagi ryzyka wyłącznie po angielsku (słownik `risk_tags`).  
15. **[DOPRECYZOWANE]** Czas i data raportu liczone w **strefie użytkownika**: zapisujemy `occurred_at` (timestamptz), `timezone` (IANA), a `report_date` = data lokalna użytkownika.  
16. **[DOPRECYZOWANE / best practices]** Retencja i skalowalność: partycjonowanie `reports` rocznie, `telemetry_events` miesięcznie; `report_links` kasowane po 90 dniach; kopie zapasowe + rotacja, brak limitu retencji dla raportów w MVP.
</decisions>

<database_planning_summary>
**a. Główne wymagania schematu**

- Jednorazowe linki (hashowane tokeny, ważność, jednorazowość, czyszczenie).
- Formularz raportu „OK/Problem” z typowanymi polami (opóźnienie, szkoda, usterka, blokery) i krótkim opisem.
- Edycja do 10 min, potem blokada; re-generacja AI przy zmianach.
- AI: `risk_level` (NONE/LOW/MEDIUM/HIGH), krótkie `ai_summary`, tagi ryzyka **po angielsku**.
- Dashboard: „Dzisiaj”, „7 dni”, eksport CSV, filtry po ryzyku.
- Telemetria: mierzenie czasu wypełnienia i konwersji linku (bez PII).
- Czas raportu liczony w **lokalnej strefie użytkownika**: zapis `occurred_at` (UTC), `timezone` (IANA), `report_date` = lokalna data użytkownika.

**b. Kluczowe encje i relacje**

- `companies`, `users` (mapa do `auth.users`).
- `drivers` (IANA `timezone`, soft-delete) ↔ `reports` (1:N, unikalność `(driver, report_date)`).
- `vehicles` (unikalne `registration_number`/`vin` w stanie aktywnym) ↔ `driver_vehicle_assignments` (okresy bez nakładania).
- `report_links` (hash tokenu, `expires_at`, `used_at`) ↔ `drivers` / `companies`.
- `report_ai_results` (1:1 do `reports`).
- `risk_tags` (EN) ↔ `report_risk_tags` (łącznik).
- `telemetry_events` (odniesienia do `link_uuid`/`report_uuid`/`driver_uuid`).
- `email_logs` (SLA wysyłek), `audit_log` (ślad zmian).

**c. Bezpieczeństwo i skalowalność**

- RLS per `company_uuid`; w MVP **jeden login** dla firmy.
- Brak DML przez `anon`; walidacja tokenów w edge function/RPC (rola serwisowa), tabele za RLS.
- Hashowanie tokenów w DB; brak przechowywania surowych tokenów.
- Indeksy GIN i czasowe; gotowość do filtrowania po ryzyku i czasie.
- Partycjonowanie: `reports` — rocznie; `telemetry_events` — miesięcznie.
- Retencja: `report_links` usuwane po 90 dniach; raporty i historie przypisań — bez limitu w MVP; kopie zapasowe codzienne, rotacja 30–90 dni (do potwierdzenia na produkcji).

**d. Uaktualnienia wynikające z doprecyzowań**

- Role/ACL: na MVP utrzymujemy **jeden login**; ewentualne role w późniejszym etapie.
- Tagi: **angielski** jako język słownika `risk_tags`.
- Czas: zapis `occurred_at` (UTC) + `timezone` (IANA); `report_date` = lokalna data użytkownika w momencie zgłoszenia (spójne z potwierdzeniem mailowym i dashboardem).
- Retencja: wdrożone „best practices” (partycjonowanie, purge tokenów, backup/rotacja); bez usuwania raportów w MVP.
  </database_planning_summary>

<unresolved_issues>
</unresolved_issues>
</conversation_summary>
